#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const inputMd = process.argv[2];
const outputDocx = process.argv[3];
const contextJson = process.argv[4];

if (!inputMd || !outputDocx) {
  console.error('Usage: generate-docx.js <input.md> <output.docx> [fa-context.json]');
  process.exit(1);
}

let docx;
try {
  docx = require('docx');
} catch (e) {
  const pluginDir = path.resolve(__dirname, '..');
  console.error(`[architect] Missing dependency 'docx'.\nRun: cd "${pluginDir}" && npm install`);
  process.exit(1);
}

// Read input
const mdContent = fs.readFileSync(path.resolve(inputMd), 'utf8');
let context = {};
if (contextJson && fs.existsSync(path.resolve(contextJson))) {
  context = JSON.parse(fs.readFileSync(path.resolve(contextJson), 'utf8'));
}

const projectName = context.project?.name || 'Project';
const projectDesc = context.project?.description || '';
const date = context.metadata?.generated_at || new Date().toISOString().split('T')[0];
const domain = context.project?.domain || '';
const scale = context.project?.scale || '';

// Parse markdown into paragraphs
const lines = mdContent.split('\n');
const children = [];

// Cover page
children.push(
  new docx.Paragraph({ spacing: { before: 4000 } }),
  new docx.Paragraph({
    alignment: docx.AlignmentType.CENTER,
    children: [new docx.TextRun({ text: projectName, font: 'Calibri', size: 60, bold: true, color: '1B365D' })]
  }),
  new docx.Paragraph({
    alignment: docx.AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [new docx.TextRun({ text: projectDesc, font: 'Calibri', size: 24, color: '666666', italics: true })]
  }),
  new docx.Paragraph({
    alignment: docx.AlignmentType.CENTER,
    spacing: { before: 600 },
    border: { bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: '1B365D', space: 1 } },
    children: []
  }),
  new docx.Paragraph({
    alignment: docx.AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [
      new docx.TextRun({ text: 'Date: ' + date, font: 'Calibri', size: 20, color: '888888' }),
      new docx.TextRun({ text: '   |   Domain: ' + domain, font: 'Calibri', size: 20, color: '888888' }),
      new docx.TextRun({ text: '   |   Scale: ' + scale, font: 'Calibri', size: 20, color: '888888' })
    ]
  }),
  new docx.Paragraph({ children: [new docx.PageBreak()] })
);

// Parse markdown lines
let inCodeBlock = false;
let inTable = false;
let tableHeaders = [];
let tableRows = [];

for (const line of lines) {
  // Code blocks
  if (line.startsWith('```')) {
    inCodeBlock = !inCodeBlock;
    continue;
  }
  if (inCodeBlock) {
    children.push(new docx.Paragraph({
      children: [new docx.TextRun({ text: line, font: 'Consolas', size: 18, color: '333333' })],
      shading: { fill: 'F5F5F5', type: docx.ShadingType.CLEAR }
    }));
    continue;
  }

  // Tables
  if (line.includes('|') && line.trim().startsWith('|')) {
    const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
    if (cells.every(c => /^[-:]+$/.test(c))) continue; // separator row
    if (!inTable) {
      inTable = true;
      tableHeaders = cells;
      tableRows = [];
    } else {
      tableRows.push(cells);
    }
    continue;
  } else if (inTable) {
    // Flush table
    const rows = [
      new docx.TableRow({
        tableHeader: true,
        children: tableHeaders.map(h => new docx.TableCell({
          shading: { fill: '1B365D', type: docx.ShadingType.CLEAR },
          children: [new docx.Paragraph({
            children: [new docx.TextRun({ text: h, bold: true, color: 'FFFFFF', font: 'Calibri', size: 20 })]
          })]
        }))
      }),
      ...tableRows.map((row, i) => new docx.TableRow({
        children: row.map(cell => new docx.TableCell({
          shading: i % 2 === 0 ? {} : { fill: 'F7FAFC', type: docx.ShadingType.CLEAR },
          children: [new docx.Paragraph({
            children: [new docx.TextRun({ text: cell, font: 'Calibri', size: 20, color: '333333' })]
          })]
        }))
      }))
    ];
    children.push(new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, rows }));
    inTable = false;
    tableHeaders = [];
    tableRows = [];
  }

  // Headings
  if (line.startsWith('# ')) {
    children.push(new docx.Paragraph({
      heading: docx.HeadingLevel.HEADING_1,
      children: [new docx.TextRun({ text: line.replace(/^# /, ''), font: 'Calibri', size: 36, bold: true, color: '1B365D' })],
      spacing: { before: 360, after: 120 },
      border: { bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: '1B365D' } }
    }));
  } else if (line.startsWith('## ')) {
    children.push(new docx.Paragraph({
      heading: docx.HeadingLevel.HEADING_2,
      children: [new docx.TextRun({ text: line.replace(/^## /, ''), font: 'Calibri', size: 28, bold: true, color: '1B365D' })],
      spacing: { before: 240, after: 120 },
      border: { bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: 'CBD5E0' } }
    }));
  } else if (line.startsWith('### ')) {
    children.push(new docx.Paragraph({
      heading: docx.HeadingLevel.HEADING_3,
      children: [new docx.TextRun({ text: line.replace(/^### /, ''), font: 'Calibri', size: 24, bold: true, color: '1B365D' })],
      spacing: { before: 200, after: 100 }
    }));
  } else if (line.startsWith('- ') || line.startsWith('* ')) {
    // Bullet list
    children.push(new docx.Paragraph({
      bullet: { level: 0 },
      children: [new docx.TextRun({ text: line.replace(/^[-*] /, ''), font: 'Calibri', size: 22, color: '333333' })]
    }));
  } else if (/^\d+\. /.test(line)) {
    // Numbered list
    children.push(new docx.Paragraph({
      numbering: { reference: 'default-numbering', level: 0 },
      children: [new docx.TextRun({ text: line.replace(/^\d+\. /, ''), font: 'Calibri', size: 22, color: '333333' })]
    }));
  } else if (line.trim() === '') {
    children.push(new docx.Paragraph({ spacing: { after: 60 } }));
  } else if (line.startsWith('> ')) {
    // Blockquote
    children.push(new docx.Paragraph({
      indent: { left: 720 },
      border: { left: { style: docx.BorderStyle.SINGLE, size: 6, color: 'CBD5E0', space: 10 } },
      shading: { fill: 'F7FAFC', type: docx.ShadingType.CLEAR },
      children: [new docx.TextRun({ text: line.replace(/^> /, ''), font: 'Calibri', size: 22, color: '4A5568', italics: true })]
    }));
  } else {
    // Regular paragraph
    children.push(new docx.Paragraph({
      children: [new docx.TextRun({ text: line, font: 'Calibri', size: 22, color: '333333' })],
      spacing: { after: 120, line: 360 }
    }));
  }
}

// Flush remaining table
if (inTable && tableHeaders.length > 0) {
  const rows = [
    new docx.TableRow({
      tableHeader: true,
      children: tableHeaders.map(h => new docx.TableCell({
        shading: { fill: '1B365D', type: docx.ShadingType.CLEAR },
        children: [new docx.Paragraph({
          children: [new docx.TextRun({ text: h, bold: true, color: 'FFFFFF', font: 'Calibri', size: 20 })]
        })]
      }))
    }),
    ...tableRows.map((row, i) => new docx.TableRow({
      children: row.map(cell => new docx.TableCell({
        shading: i % 2 === 0 ? {} : { fill: 'F7FAFC', type: docx.ShadingType.CLEAR },
        children: [new docx.Paragraph({
          children: [new docx.TextRun({ text: cell, font: 'Calibri', size: 20, color: '333333' })]
        })]
      }))
    }))
  ];
  children.push(new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, rows }));
}

// Footer
const footer = new docx.Footer({
  children: [new docx.Paragraph({
    alignment: docx.AlignmentType.CENTER,
    children: [
      new docx.TextRun({ text: projectName + ' — ', font: 'Calibri', size: 16, color: '888888' }),
      new docx.TextRun({ children: [docx.PageNumber.CURRENT], font: 'Calibri', size: 16, color: '888888' }),
      new docx.TextRun({ text: ' / ', font: 'Calibri', size: 16, color: '888888' }),
      new docx.TextRun({ children: [docx.PageNumber.TOTAL_PAGES], font: 'Calibri', size: 16, color: '888888' })
    ]
  })]
});

// Build document
const doc = new docx.Document({
  creator: 'Architect Plugin',
  title: projectName,
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22, color: '333333' },
        paragraph: { spacing: { after: 120, line: 360 } }
      }
    }
  },
  numbering: {
    config: [{
      reference: 'default-numbering',
      levels: [{ level: 0, format: docx.LevelFormat.DECIMAL, text: '%1.', alignment: docx.AlignmentType.START }]
    }]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      footers: { default: footer }
    },
    children: children
  }]
});

docx.Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(path.resolve(outputDocx), buffer);
  console.log('DOCX generated: ' + outputDocx);
}).catch(err => {
  console.error('DOCX generation failed:', err.message);
  process.exit(1);
});
