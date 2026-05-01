interface Props { url: string; nome: string }

export function PdfViewer({ url, nome }: Props) {
  return (
    <iframe
      src={`${url}#toolbar=1&navpanes=0`}
      title={nome}
      className="w-full h-full border-0 rounded-md bg-muted"
    />
  );
}
