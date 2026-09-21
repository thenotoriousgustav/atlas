/**
 * Zero-latency Client-side Natural Language Parser for Queue Quick-Capture
 * ponytail: fast regex-based tokenizer, runs in 0ms on keystroke without API latency or cost!
 */

export interface ParsedTaskInput {
  cleanTitle: string;
  dueDate?: string; // YYYY-MM-DD
  dueLabel?: string; // "Today", "Tomorrow", "Next Monday", etc.
  dueTime?: string; // "10:00", "15:30"
  projectName?: string; // e.g. "Inovasi"
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  labels: string[];
}

export function parseNaturalLanguageTask(
  rawInput: string,
  availableProjectNames: string[] = []
): ParsedTaskInput {
  let text = rawInput.trim();
  let dueDate: string | undefined = undefined;
  let dueLabel: string | undefined = undefined;
  let dueTime: string | undefined = undefined;
  let projectName: string | undefined = undefined;
  let priority: 'P1' | 'P2' | 'P3' | 'P4' | undefined = undefined;
  const labels: string[] = [];

  const now = new Date();

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. Parse Time (e.g. "jam 10", "jam 10:30", "14:00", "10:00am", "2pm")
  const timeMatch = text.match(/\bjam\s+(\d{1,2})(?::(\d{2}))?\b/i) || text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (timeMatch && timeMatch[1]) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (hours < 24 && minutes < 60) {
      dueTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      text = text.replace(timeMatch[0], ' ');
    }
  }

  // 2. Parse Date Keywords (Indonesian & English)
  if (/\b(hari ini|today)\b/i.test(text)) {
    dueDate = formatDate(now);
    dueLabel = 'Today';
    text = text.replace(/\b(hari ini|today)\b/i, ' ');
  } else if (/\b(besok|tomorrow)\b/i.test(text)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate = formatDate(tomorrow);
    dueLabel = 'Tomorrow';
    text = text.replace(/\b(besok|tomorrow)\b/i, ' ');
  } else if (/\b(lusa)\b/i.test(text)) {
    const lusa = new Date(now);
    lusa.setDate(lusa.getDate() + 2);
    dueDate = formatDate(lusa);
    dueLabel = 'In 2 days';
    text = text.replace(/\b(lusa)\b/i, ' ');
  } else if (/\b(minggu depan|next week)\b/i.test(text)) {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    dueDate = formatDate(nextWeek);
    dueLabel = 'Next week';
    text = text.replace(/\b(minggu depan|next week)\b/i, ' ');
  }

  // Weekdays (senin, selasa, rabu, kamis, jumat, sabtu, minggu / mon, tue, etc.)
  const dayMap: { [key: string]: number } = {
    minggu: 0,
    sunday: 0,
    sun: 0,
    senin: 1,
    monday: 1,
    mon: 1,
    selasa: 2,
    tuesday: 2,
    tue: 2,
    rabu: 3,
    wednesday: 3,
    wed: 3,
    kamis: 4,
    thursday: 4,
    thu: 4,
    jumat: 5,
    friday: 5,
    fri: 5,
    sabtu: 6,
    saturday: 6,
    sat: 6,
  };

  for (const [dayName, dayIndex] of Object.entries(dayMap)) {
    const regex = new RegExp(`\\b(?:hari\\s+)?${dayName}\\b`, 'i');
    if (!dueDate && regex.test(text)) {
      const currentDay = now.getDay();
      let diff = dayIndex - currentDay;
      if (diff <= 0) diff += 7; // Next occurrence
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + diff);
      dueDate = formatDate(targetDate);
      dueLabel = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      text = text.replace(regex, ' ');
      break;
    }
  }

  // 3. Priority: !p1, p1, !urgent, #urgent, p2, p3, p4
  if (/(?:^|\s)!(?:p1|urgent)\b/i.test(text) || /\bp1\b/i.test(text)) {
    priority = 'P1';
    text = text.replace(/(?:^|\s)!(?:p1|urgent)\b/i, ' ').replace(/\bp1\b/i, ' ');
  } else if (/(?:^|\s)!(?:p2|high)\b/i.test(text) || /\bp2\b/i.test(text)) {
    priority = 'P2';
    text = text.replace(/(?:^|\s)!(?:p2|high)\b/i, ' ').replace(/\bp2\b/i, ' ');
  } else if (/(?:^|\s)!(?:p3|med|medium)\b/i.test(text) || /\bp3\b/i.test(text)) {
    priority = 'P3';
    text = text.replace(/(?:^|\s)!(?:p3|med|medium)\b/i, ' ').replace(/\bp3\b/i, ' ');
  } else if (/(?:^|\s)!(?:p4|low)\b/i.test(text) || /\bp4\b/i.test(text)) {
    priority = 'P4';
    text = text.replace(/(?:^|\s)!(?:p4|low)\b/i, ' ').replace(/\bp4\b/i, ' ');
  }

  // 4. Project: @ProjectName, project:Name, or "untuk project Name"
  const atProjectMatch = text.match(/@([\w-]+)/);
  if (atProjectMatch && atProjectMatch[1]) {
    projectName = atProjectMatch[1];
    text = text.replace(atProjectMatch[0], ' ');
  } else {
    const projectPrefixMatch = text.match(/(?:untuk\s+project|project:)\s*([a-zA-Z0-9_-]+)/i);
    if (projectPrefixMatch && projectPrefixMatch[1]) {
      projectName = projectPrefixMatch[1];
      text = text.replace(projectPrefixMatch[0], ' ');
    } else {
      // Fuzzy search against available project names
      for (const p of availableProjectNames) {
        const pRegex = new RegExp(`\\b${p}\\b`, 'i');
        if (pRegex.test(text)) {
          projectName = p;
          text = text.replace(pRegex, ' ');
          break;
        }
      }
    }
  }

  // 5. Labels: #labelName
  const labelMatches = text.match(/#([\w-]+)/g);
  if (labelMatches) {
    for (const match of labelMatches) {
      const cleanLabel = match.slice(1).toLowerCase();
      if (cleanLabel === 'urgent' && !priority) {
        priority = 'P1';
      } else {
        labels.push(cleanLabel);
      }
      text = text.replace(match, ' ');
    }
  }

  // Clean up excess whitespace in title
  const cleanTitle = text
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();

  return {
    cleanTitle: cleanTitle || rawInput.trim(),
    dueDate,
    dueLabel,
    dueTime,
    projectName,
    priority,
    labels,
  };
}
