export function printHTML(html: string, filename: string) {
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Noto Sans Arabic', Tahoma, sans-serif;
      direction: rtl;
      background: #fff;
      color: #0f172a;
      font-size: 11px;
      padding: 30px;
    }
    .page { max-width: 100%; }
    .hdr {
      padding: 18px 24px;
      color: #fff;
      border-radius: 8px 8px 0 0;
      margin-bottom: 2px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .hdr h1 { font-size: 18px; font-weight: 700; margin: 0; }
    .meta {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-top: none;
      padding: 10px 18px;
      font-size: 11px;
      color: #475569;
      margin-bottom: 18px;
      border-radius: 0 0 8px 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 5px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    th {
      padding: 10px 12px;
      text-align: right;
      font-weight: 700;
      color: #edf2f7;
    }
    td {
      padding: 9px 12px;
      border-bottom: 1px solid #edf2f7;
      text-align: right;
      vertical-align: middle;
      color: #334155;
    }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #f8fafc; }
    .num { text-align: center; }
    .ok { color: #16a34a; font-weight: 700; }
    .low { color: #d97706; font-weight: 700; }
    .zero { color: #e53e3e; font-weight: 700; }
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
    }
    .badge-ok { background: #dcfce7; color: #16a34a; }
    .badge-low { background: #fef9c3; color: #b45309; }
    .badge-zero { background: #fee2e2; color: #e53e3e; }
    .ftr {
      margin-top: 24px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        padding: 0;
      }
    }
  `;

  // Create a blob for downloading/printing
  const fullHTML = `<!DOCTYPE html>
<html dir="rtl" lang="ckb">
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <style>${CSS}</style>
</head>
<body>
  ${html}
</body>
</html>`;

  const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Try opening in a new window for beautiful native printing or offer manual download
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.focus();
      // wait a tiny bit to make sure font renders then print
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  } else {
    // Fallback: direct download link if blocked by pop-ups
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1000);
  }
}
