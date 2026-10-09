
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

/**
 * Generates an MS Word (.docx) file from notebook text/content.
 * @param title Notebook title
 * @param textContent Extracted text from the canvas or note
 */
export const exportToMSWord = async (title: string, textContent: string) => {
  // Split content by newlines to make actual paragraphs
  const paragraphs = textContent.split('\n').map(line => 
    new Paragraph({
      children: [new TextRun({ text: line, size: 24 })], // size 24 is 12pt font
      spacing: { after: 200 }
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 400 }
          }),
          ...paragraphs
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title}.docx`);
};

/**
 * Invokes the native Share API to share the notebook via Telegram, WhatsApp, Email, etc.
 */
export const shareViaWeb = async (title: string, text: string, url: string = window.location.href) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `NoteCraft Pro: ${title}`,
        text: text,
        url: url,
      });
      console.log('Successful share');
    } catch (error) {
      console.log('Error sharing', error);
    }
  } else {
    // Fallback: Copy to clipboard or direct Telegram link
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title + '\n' + text)}`;
    window.open(telegramUrl, '_blank');
  }
};
