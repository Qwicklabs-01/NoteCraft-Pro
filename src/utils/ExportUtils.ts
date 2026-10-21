import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { getTelegramWebApp } from './telegram';

// Helper to convert base64 / data URL to Uint8Array for docx
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || dataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates an MS Word (.docx) file from notebook text and drawing snapshot.
 */
export const exportToMSWord = async (title: string, textContent: string, canvasDataUrl?: string) => {
  const children: (Paragraph)[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 }
    })
  ];

  // If we have a snapshot of the canvas, embed it into the Word document
  if (canvasDataUrl) {
    try {
      const imgBytes = dataUrlToUint8Array(canvasDataUrl);
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imgBytes,
              transformation: {
                width: 540,
                height: 405,
              },
            }),
          ],
          spacing: { after: 400 },
        })
      );
    } catch (err) {
      console.warn('Could not embed drawing into docx:', err);
    }
  }

  // Split text content into paragraphs
  const lines = textContent.split('\n');
  lines.forEach(line => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: line, size: 24 })],
        spacing: { after: 160 }
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/[^a-z0-9]/gi, '_')}.docx`);
};

/**
 * Exports one or multiple pages to a polished PDF document.
 */
export const exportToPDF = (title: string, canvasDataUrls: string[], textContent?: string) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2 - 12; // leave room for header & footer

  if (canvasDataUrls.length === 0) {
    pdf.setFontSize(22);
    pdf.setTextColor(30, 41, 59);
    pdf.text(title, margin, margin + 20);

    pdf.setFontSize(11);
    pdf.setTextColor(71, 85, 105);
    const body = textContent || 'Digital notebook created with NoteCraft Pro.';
    const splitText = pdf.splitTextToSize(body, contentWidth);
    pdf.text(splitText, margin, margin + 35);

    pdf.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    return;
  }

  canvasDataUrls.forEach((dataUrl, idx) => {
    if (idx > 0) {
      pdf.addPage();
    }

    // Header
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`NoteCraft Pro • ${title}`, margin, margin);

    // Drawing Image
    try {
      pdf.addImage(dataUrl, 'PNG', margin, margin + 4, contentWidth, contentHeight, undefined, 'FAST');
    } catch (err) {
      console.error('Failed to add page to PDF:', err);
    }

    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(140, 140, 140);
    pdf.text(`Page ${idx + 1} of ${canvasDataUrls.length}`, pageWidth - margin - 22, pageHeight - 5);
  });

  pdf.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

/**
 * Downloads a single page as high-res PNG image.
 */
export const exportToPNG = (title: string, canvasDataUrl: string, pageNumber: number = 1) => {
  const link = document.createElement('a');
  link.download = `${title.replace(/[^a-z0-9]/gi, '_')}-page-${pageNumber}.png`;
  link.href = canvasDataUrl;
  link.click();
};

/**
 * Shares via native Web Share API or Telegram.
 */
export const shareViaWeb = async (title: string, text: string, url: string = window.location.href) => {
  const tg = getTelegramWebApp();

  // If in Telegram WebApp
  if (tg) {
    const shareText = encodeURIComponent(`${title}\n${text}\n${url}`);
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${shareText}`;
    if (typeof tg.openTelegramLink === 'function') {
      tg.openTelegramLink(tgUrl);
      return;
    }
  }

  // If browser supports navigator.share
  if (navigator.share) {
    try {
      await navigator.share({
        title: `NoteCraft Pro: ${title}`,
        text,
        url,
      });
      return;
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('Share dismissed or failed:', err);
      }
    }
  }

  // Fallback: Copy link and open Telegram share
  try {
    await navigator.clipboard.writeText(`${title} - ${url}`);
  } catch {
    // Clipboard permission optional
  }

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title + '\n' + text)}`;
  window.open(telegramUrl, '_blank');
};
