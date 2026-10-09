/* eslint-disable */
import React from 'react';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

interface PDFExporterProps {
  notebookId: string;
  pages: any[];
  title: string;
}

const PDFExporter: React.FC<PDFExporterProps> = ({ notebookId, pages, title }) => {
  const exportToPDF = async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      const pageData = pages[i].content;
      
      // Convert canvas data to image
      if (pageData.objects) {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1600;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Render all objects from fabric.js
          pageData.objects.forEach((obj: any) => {
            // Render paths, shapes, text, images
            // This is simplified - actual implementation would use fabric.js rendering
          });
          
          const imageData = canvas.toDataURL('image/png');
          pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight);
        }
      }
      
      // Add page number
      pdf.setFontSize(10);
      pdf.text(`Page ${i + 1}`, pageWidth - 20, pageHeight - 10);
    }
    
    pdf.save(`${title}.pdf`);
  };
  
  const exportToPNG = async (pageIndex: number) => {
    const pageData = pages[pageIndex].content;
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render page content
      // Implementation would use fabric.js rendering
      
      const imageData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${title}-page-${pageIndex + 1}.png`;
      link.href = imageData;
      link.click();
    }
  };
  
  return (
    <div className="export-options">
      <h3>Export Options</h3>
      <button onClick={exportToPDF}>Export as PDF</button>
      <button onClick={() => exportToPNG(0)}>Export Current Page as PNG</button>
      <button onClick={() => pages.forEach((_, i) => exportToPNG(i))}>Export All Pages as PNG</button>
    </div>
  );
};

export default PDFExporter;

