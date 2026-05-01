interface Props { url: string; nome: string }

export function OfficeViewer({ url, nome }: Props) {
  const src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  return (
    <iframe
      src={src}
      title={nome}
      className="w-full h-full border-0 rounded-md bg-muted"
    />
  );
}
