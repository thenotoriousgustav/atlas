import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateEmailSyncConfigDto, SimulateEmailDto } from './dto/update-email-sync.dto';
import * as tls from 'tls';
import * as crypto from 'crypto';

@Injectable()
export class EmailSyncService {
  constructor(private readonly prisma: PrismaService) {}

  async testConnection(userId: string): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig(userId);
    if (!config || !config.username || !config.password) {
      return { success: false, message: 'Email credentials are not configured.' };
    }

    const host = (config.imapHost || 'imap.gmail.com').replace(/@/g, '.').trim();

    return new Promise((resolve) => {
      try {
        const socket = tls.connect({
          host,
          port: config.imapPort,
          rejectUnauthorized: false
        });

        let resolved = false;
        socket.setTimeout(5000);

        socket.on('data', (data) => {
          const response = data.toString();
          if (response.includes('* OK')) {
            socket.write(`A1 LOGIN ${config.username} ${config.password}\r\n`);
          } else if (response.includes('A1 OK')) {
            if (!resolved) {
              resolved = true;
              socket.write('A2 LOGOUT\r\n');
              socket.end();
              resolve({ success: true, message: 'Connection to Gmail IMAP server successful!' });
            }
          } else if (response.includes('A1 NO') || response.includes('A1 BAD') || response.includes('AUTHENTICATIONFAILED')) {
            if (!resolved) {
              resolved = true;
              socket.end();
              resolve({ success: false, message: 'Incorrect username or App Password.' });
            }
          }
        });

        socket.on('error', (err) => {
          if (!resolved) {
            resolved = true;
            resolve({ success: false, message: `Failed to connect to email server: ${err.message}` });
          }
        });

        socket.on('timeout', () => {
          if (!resolved) {
            resolved = true;
            socket.end();
            resolve({ success: false, message: 'Connection timeout (5 seconds).' });
          }
        });
      } catch (err: any) {
        resolve({ success: false, message: `Connection error: ${err.message}` });
      }
    });
  }

  async getConfig(userId: string) {
    let config = await this.prisma.emailSyncConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      config = await this.prisma.emailSyncConfig.create({
        data: {
          userId,
          imapHost: 'imap.gmail.com',
          imapPort: 993,
          username: '',
          password: '',
          isActive: false,
        },
      });
    }

    return config;
  }

  async saveConfig(userId: string, dto: UpdateEmailSyncConfigDto) {
    const imapHost = (dto.imapHost || 'imap.gmail.com').replace(/@/g, '.').trim();
    return this.prisma.emailSyncConfig.upsert({
      where: { userId },
      update: {
        imapHost,
        imapPort: dto.imapPort,
        username: dto.username,
        password: dto.password,
        isActive: dto.isActive,
      },
      create: {
        userId,
        imapHost,
        imapPort: dto.imapPort,
        username: dto.username,
        password: dto.password,
        isActive: dto.isActive,
      },
    });
  }

  async syncRealIMAPEmails(userId: string): Promise<any[]> {
    const config = await this.getConfig(userId);
    if (!config || !config.username || !config.password) {
      return [];
    }

    const host = (config.imapHost || 'imap.gmail.com').replace(/@/g, '.').trim();

    const emailsToProcess: Array<{ subject: string; body: string }> = await new Promise((resolve) => {
      try {
        const socket = tls.connect({
          host,
          port: config.imapPort,
          rejectUnauthorized: false
        });

        let step = 0;
        let buffer = '';
        let targetMsgIds: string[] = [];
        const fetchedEmails: Array<{ subject: string; body: string }> = [];
        let resolved = false;

        socket.setTimeout(12000);

        socket.on('data', (data) => {
          buffer += data.toString();
          
          if (step === 0 && buffer.includes('* OK')) {
            step = 1;
            buffer = '';
            socket.write(`A1 LOGIN ${config.username} ${config.password}\r\n`);
          } else if (step === 1 && buffer.includes('A1 OK')) {
            step = 2;
            buffer = '';
            socket.write(`A2 SELECT INBOX\r\n`);
          } else if (step === 2 && buffer.includes('A2 OK')) {
            step = 3;
            buffer = '';
            socket.write(`A3 SEARCH OR TEXT "Mandiri" TEXT "Jago"\r\n`);
          } else if (step === 3 && buffer.includes('A3 OK')) {
            const searchMatch = buffer.match(/\*\s+SEARCH\s+([0-9\s]+)/i);
            if (searchMatch && searchMatch[1]) {
              const ids = searchMatch[1].trim().split(/\s+/).filter(Boolean);
              targetMsgIds = ids.slice(-15);
            }
            
            step = 4;
            buffer = '';
            
            if (targetMsgIds.length > 0) {
              const sequenceList = targetMsgIds.join(',');
              socket.write(`A4 FETCH ${sequenceList} (BODY[HEADER.FIELDS (SUBJECT)] BODY[TEXT])\r\n`);
            } else {
              if (!resolved) {
                resolved = true;
                socket.write('A4 LOGOUT\r\n');
                socket.end();
                resolve([]);
              }
            }
          } else if (step === 4 && (buffer.includes('A4 OK') || buffer.includes('A4 BAD') || buffer.includes('A4 NO'))) {
            if (!resolved) {
              resolved = true;
              const blocks = buffer.split(/FETCH \(/i);
              for (const block of blocks) {
                const subjMatch = block.match(/Subject:\s*([^\r\n]+)/i);
                if (subjMatch) {
                  const subject = subjMatch[1].trim();
                  const bodyIndex = block.indexOf('\r\n\r\n');
                  const body = bodyIndex !== -1 ? block.substring(bodyIndex + 4) : block;
                  fetchedEmails.push({ subject, body });
                }
              }
              socket.write('A5 LOGOUT\r\n');
              socket.end();
              resolve(fetchedEmails);
            }
          } else if (buffer.includes('A1 NO') || buffer.includes('A1 BAD')) {
            if (!resolved) {
              resolved = true;
              socket.end();
              resolve([]);
            }
          }
        });

        socket.on('error', () => {
          if (!resolved) {
            resolved = true;
            resolve([]);
          }
        });

        socket.on('timeout', () => {
          if (!resolved) {
            resolved = true;
            socket.end();
            resolve(fetchedEmails);
          }
        });
      } catch (err) {
        resolve([]);
      }
    });

    if (emailsToProcess.length === 0) {
      return [];
    }

    return this.syncSimulatedEmails(userId, emailsToProcess);
  }

  async syncSimulatedEmails(userId: string, emails: SimulateEmailDto[]) {
    const results = [];

    for (const email of emails) {
      const parsed = this.parseEmailContent(email.subject, email.body);
      if (parsed) {
        // ponytail: use standard library crypto to prevent duplicate syncing
        const emailHash = crypto
          .createHash('sha256')
          .update(email.subject + email.body)
          .digest('hex');

        // Check if transaction with this hash already exists
        const existingTx = await this.prisma.transaction.findFirst({
          where: {
            userId,
            deletedAt: null,
            description: {
              contains: `[hash:${emailHash}]`,
            },
          },
        });

        if (existingTx) {
          continue; // Skip duplicate transaction
        }

        // Resolve account or create one
        let account = await this.prisma.account.findFirst({
          where: {
            userId,
            deletedAt: null,
            name: {
              contains: parsed.bank,
              mode: 'insensitive',
            },
          },
        });

        if (!account) {
          account = await this.prisma.account.create({
            data: {
              userId,
              name: `Bank ${parsed.bank}`,
              type: 'CHECKING',
              balance: 1000000, // starting seed balance
              currency: 'IDR',
              isOnBudget: true,
            },
          });
        }

        // Create transaction
        const transaction = await this.prisma.transaction.create({
          data: {
            userId,
            accountId: account.id,
            type: parsed.type,
            amount: parsed.amount,
            title: parsed.title,
            description: `Auto-sync via Email: Bank ${parsed.bank} [hash:${emailHash}]`,
            date: new Date(),
          },
          include: {
            account: true,
          },
        });

        // Update account balance
        const balanceChange = parsed.type === 'INCOME' ? parsed.amount : -parsed.amount;
        await this.prisma.account.update({
          where: { id: account.id },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });

        results.push(transaction);
      }
    }

    // Update last sync time
    await this.prisma.emailSyncConfig.updateMany({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
      },
    });

    return results;
  }

  private parseEmailContent(subject: string, body: string): { bank: string; type: 'EXPENSE' | 'INCOME'; amount: number; title: string } | null {
    // 1. Decode Quoted-Printable
    let cleanBody = body
      .replace(/=([0-[#9F2F2D]A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/=\r?\n/g, '');

    // 2. Strip HTML tags & decode common entities
    cleanBody = cleanBody
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');

    const combined = `${subject} \n ${cleanBody}`;
    
    // Determine Bank
    let bank = '';
    if (/jago/i.test(combined)) {
      bank = 'Jago';
    } else if (/mandiri/i.test(combined)) {
      bank = 'Mandiri';
    } else {
      return null; // Not Jago or Mandiri
    }

    // Extract Amount (IDR or Rp followed by numbers, e.g. Rp 10.000,00 or IDR 250.000)
    let amount = 0;
    const amountRegex = /(?:nominal|nominal\s*rp|rp|idr)\.?\s*([0-9\.,]+)/i;
    const amountMatch = combined.match(amountRegex);
    if (amountMatch && amountMatch[1]) {
      // Normalize number format (remove dots, replace comma with dot)
      const rawNumber = amountMatch[1].replace(/\./g, '').replace(/,/g, '.');
      amount = parseFloat(rawNumber);
    }

    if (isNaN(amount) || amount <= 0) return null;

    // Determine Type (Expense vs Income)
    let type: 'EXPENSE' | 'INCOME' = 'EXPENSE';
    if (/uang masuk|kredit|credit|received|inflow|ditransfer dari|transfer masuk|pengirim|dana masuk|setoran/i.test(combined)) {
      type = 'INCOME';
    } else if (/transfer berhasil|uang keluar|debet|debit|payment|transfer ke|ke gopay|ke shopeepay|penerima/i.test(combined)) {
      type = 'EXPENSE';
    }

    // Extract Merchant / Sender / Receiver Title
    let title = '';
    
    // Check for Pengirim format (Income)
    if (type === 'INCOME') {
      const pengirimMatch = combined.match(/(?:pengirim|ditransfer dari|dari)\s*[\r\n]*\s*([^\r\n]+)/i);
      if (pengirimMatch && pengirimMatch[1]) {
        const senderName = pengirimMatch[1].trim();
        if (senderName && !senderName.toLowerCase().includes('bank')) {
          title = `Transfer dari ${senderName}`;
        }
      }
    }

    // Check for Penerima format (Expense)
    if (!title) {
      const penerimaMatch = combined.match(/Penerima\s*[\r\n]*\s*([^\r\n]+)/i);
      if (penerimaMatch && penerimaMatch[1]) {
        const recipientName = penerimaMatch[1].trim();
        if (recipientName && !recipientName.toLowerCase().includes('bank')) {
          title = `Transfer ke ${recipientName}`;
        }
      }
    }

    if (!title) {
      const merchantRegex = /(?:ke|dari|gopay|shopeepay)\s+([a-z0-9\s]+)/i;
      const merchantMatch = combined.match(merchantRegex);
      if (merchantMatch && merchantMatch[1]) {
        title = merchantMatch[1].trim().split('\n')[0].substring(0, 30);
      } else {
        title = type === 'EXPENSE' ? `Pengeluaran Bank ${bank}` : `Pemasukan Bank ${bank}`;
      }
    }

    return {
      bank,
      type,
      amount,
      title: title || (type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'),
    };
  }
}
