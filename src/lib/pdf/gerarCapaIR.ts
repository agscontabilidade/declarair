import jsPDF from 'jspdf';

interface CapaData {
  nomeCliente: string;
  cpfCliente: string;
  anoBase: string;
  nomeEscritorio: string;
  nomeContador: string;
  telefoneEscritorio: string;
  emailEscritorio: string;
  logoUrl: string | null;
}

export async function gerarCapaIR(data: CapaData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = 210;
  const h = 297;

  // Background gradient simulation (solid navy)
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, w, h, 'F');

  // Decorative accent bar
  doc.setFillColor(59, 130, 246);
  doc.rect(0, h * 0.42, w, 2, 'F');

  // Logo
  if (data.logoUrl) {
    try {
      const response = await fetch(data.logoUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, 'PNG', 15, 15, 35, 35);
    } catch {
      // fallback: show name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(data.nomeEscritorio || 'Escritório', 15, 30);
    }
  } else if (data.nomeEscritorio) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(data.nomeEscritorio, 15, 30);
  }

  // Title
  doc.setTextColor(200, 210, 230);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('DECLARAÇÃO DE', w / 2, 90, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPOSTO DE RENDA', w / 2, 108, { align: 'center' });

  // Year
  doc.setTextColor(96, 180, 230);
  doc.setFontSize(52);
  doc.setFont('helvetica', 'bold');
  doc.text(data.anoBase, w / 2, 140, { align: 'center' });

  // Divider line
  doc.setDrawColor(255, 255, 255, 80);
  doc.setLineWidth(0.3);
  doc.line(40, 160, w - 40, 160);

  // Client name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.nomeCliente || 'Nome do Cliente', w / 2, 175, { align: 'center' });

  // CPF
  doc.setTextColor(180, 190, 210);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`CPF: ${data.cpfCliente || '000.000.000-00'}`, w / 2, 185, { align: 'center' });

  // Divider line
  doc.line(40, 195, w - 40, 195);

  // Contador
  doc.setTextColor(160, 170, 190);
  doc.setFontSize(8);
  doc.text('CONTADOR(A) RESPONSÁVEL', 15, 240);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.nomeContador || '—', 15, 248);

  // Contact info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(160, 170, 190);
  let contactY = 260;

  if (data.telefoneEscritorio) {
    doc.text(`Tel: ${data.telefoneEscritorio}`, 15, contactY);
    contactY += 6;
  }
  if (data.emailEscritorio) {
    doc.text(`Email: ${data.emailEscritorio}`, 15, contactY);
  }

  // Footer
  doc.setTextColor(120, 130, 150);
  doc.setFontSize(7);
  doc.text('Documento gerado pelo DeclaraIR', w / 2, h - 10, { align: 'center' });

  // Save
  const fileName = `Capa_IR_${(data.nomeCliente || 'Cliente').replace(/\s+/g, '_')}_${data.anoBase}.pdf`;
  doc.save(fileName);
}
