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
          rejectUnauthorized: false,
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
          } else if (
            response.includes('A1 NO') ||
            response.includes('A1 BAD') ||
            response.includes('AUTHENTICATIONFAILED')
          ) {
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
          rejectUnauthorized: false,
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
            socket.write(`A3 SEARCH ALL\r\n`);
          } else if (step === 3 && buffer.includes('A3 OK')) {
            const searchMatch = buffer.match(/\*\s+SEARCH\s+([0-9\s]+)/i);
            if (searchMatch && searchMatch[1]) {
              const ids = searchMatch[1].trim().split(/\s+/).filter(Boolean);
              targetMsgIds = ids.slice(-25); // Process up to 25 latest emails
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
          } else if (
            step === 4 &&
            (buffer.includes('A4 OK') || buffer.includes('A4 BAD') || buffer.includes('A4 NO'))
          ) {
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
        // SHA-256 Hash to prevent duplicate syncing
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

        // Resolve account or create one for the bank
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
            date: parsed.date || new Date(),
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

  private parseEmailContent(
    subject: string,
    body: string
  ): { bank: string; type: 'EXPENSE' | 'INCOME'; amount: number; title: string; date?: Date } | null {
    // 1. Decode Quoted-Printable
    let cleanBody = body
      .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
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

    // 3. Determine Bank
    let bank = '';
    if (/jago/i.test(combined)) {
      bank = 'Jago';
    } else if (/mandiri/i.test(combined)) {
      bank = 'Mandiri';
    } else if (/blu|bca/i.test(combined)) {
      bank = 'blu (BCA)';
    } else {
      return null; // Unsupported bank
    }

    // 4. Extract Amount (handles "Rp 10.000", "Rp 70.000,00", "Nominal: Rp 10.000,00")
    let amount = 0;
    const amountRegex = /(?:nominal|total|amount)\s*:?\s*(?:rp|idr)?\.?\s*([0-9\.,]+)/i;
    const amountMatch = combined.match(amountRegex) || combined.match(/(?:rp|idr)\.?\s*([0-9\.,]+)/i);

    if (amountMatch && amountMatch[1]) {
      let rawNumber = amountMatch[1].trim();
      // If ends with ,00 or .00 decimal suffix
      if (rawNumber.endsWith(',00') || rawNumber.endsWith('.00')) {
        rawNumber = rawNumber.slice(0, -3);
      }
      // Strip thousand separator dots or commas
      const cleanDigits = rawNumber.replace(/[\.,]/g, '');
      amount = parseFloat(cleanDigits);
    }

    if (isNaN(amount) || amount <= 0) return null;

    // 5. Determine Type (EXPENSE vs INCOME)
    let type: 'EXPENSE' | 'INCOME' = 'EXPENSE';
    if (
      /uang masuk|kredit|credit|received|inflow|ditransfer dari|transfer masuk|pengirim|dana masuk|setoran/i.test(
        combined
      )
    ) {
      type = 'INCOME';
    } else if (
      /transfer berhasil|payment|uang keluar|debet|debit|transfer ke|ke gopay|ke shopeepay|penerima|you have made a payment/i.test(
        combined
      )
    ) {
      type = 'EXPENSE';
    }

    // 6. Extract Recipient / Merchant / Sender Title
    let title = '';

    // Check for "To" or "Penerima" (Jago & Mandiri format)
    const toMatch = combined.match(/(?:to|penerima)\s*:?\s*([^\r\n]+)/i);
    if (toMatch && toMatch[1]) {
      let recipient = toMatch[1].trim();
      // Remove trailing account numbers if present (e.g. "warkop Iwan camp java 9360000...")
      recipient = recipient.replace(/[0-9]{8,}/g, '').trim();
      if (recipient && !recipient.toLowerCase().includes('bank')) {
        title = recipient;
      }
    }

    // Check for "Pengirim" (Income format)
    if (!title && type === 'INCOME') {
      const pengirimMatch = combined.match(/(?:pengirim|ditransfer dari|dari)\s*:?\s*([^\r\n]+)/i);
      if (pengirimMatch && pengirimMatch[1]) {
        let sender = pengirimMatch[1].trim().replace(/[0-9]{8,}/g, '').trim();
        if (sender && !sender.toLowerCase().includes('bank')) {
          title = `Transfer dari ${sender}`;
        }
      }
    }

    if (!title) {
      const merchantMatch = combined.match(/(?:ke|dari|gopay|shopeepay)\s+([a-z0-9\s]+)/i);
      if (merchantMatch && merchantMatch[1]) {
        title = merchantMatch[1].trim().split('\n')[0].substring(0, 30);
      } else {
        title = type === 'EXPENSE' ? `Pengeluaran Bank ${bank}` : `Pemasukan Bank ${bank}`;
      }
    }

    // 7. Extract Date if available (e.g. "21 July 2026", "27 Mei 2025", "20 Jul 2026")
    let date: Date | undefined;
    const dateMatch = combined.match(/([0-9]{1,2})\s+(jan|feb|mar|apr|mei|may|jun|jul|aug|agt|sep|okt|oct|nov|des|dec)[a-z]*\s+([0-9]{4})/i);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const monthStr = dateMatch[2].toLowerCase();
      const year = parseInt(dateMatch[3], 10);

      const monthsMap: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5,
        jul: 6, aug: 7, agt: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11,
      };

      if (monthsMap[monthStr] !== undefined) {
        date = new Date(year, monthsMap[monthStr], day);
      }
    }

    return {
      bank,
      type,
      amount,
      title: title || (type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'),
      date,
    };
  }
}
