import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Button } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface EnvioManualDeclaracaoProps {
  nomeCliente?: string
  nomeEscritorio?: string
  anoBase?: string
  mensagemPersonalizada?: string
  attachmentLinks?: Array<{ filename?: string; url?: string }>
}

const EnvioManualDeclaracaoEmail = ({ 
  nomeCliente, 
  nomeEscritorio, 
  anoBase, 
  mensagemPersonalizada,
  attachmentLinks = [],
}: EnvioManualDeclaracaoProps) => {
  // Converte quebras de linha em <br /> se necessário, ou apenas renderiza como parágrafos
  const lines = mensagemPersonalizada?.split('\n') || []

  // Parser simples de **negrito** (markdown). Sem dependências; React escapa o resto.
  const renderBold = (line: string): React.ReactNode[] => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, idx) => {
      const m = /^\*\*([^*]+)\*\*$/.exec(part)
      if (m) {
        return <strong key={idx}>{m[1]}</strong>
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>
    })
  }

  return (
    <EmailLayout 
      preview={`📄 Sua declaração IRPF ${anoBase || ''} e o recibo estão disponíveis.`}
      siteName={nomeEscritorio || SITE_NAME}
    >
      <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
        Sua Declaração e Recibo
      </Heading>

      <Text className="text-gray-800 text-[14px] leading-[24px]">
        Olá <strong>{nomeCliente || 'contribuinte'}</strong>,
      </Text>

      <Section className="my-[24px]">
        {lines.length > 0 ? (
          lines.map((line, i) => (
            <Text key={i} className="text-gray-800 text-[14px] leading-[24px] m-0 mb-2">
              {renderBold(line)}
            </Text>
          ))
        ) : (
          <Text className="text-gray-800 text-[14px] leading-[24px]">
            Sua Declaração de Imposto de Renda {anoBase || ''} e o respectivo recibo de entrega seguem em anexo a este e-mail.
          </Text>
        )}
      </Section>

      <Text className="text-gray-800 text-[14px] leading-[24px]">
        Você também pode baixar esses documentos a qualquer momento acessando seu portal.
      </Text>

      {attachmentLinks.length > 0 && (
        <Section className="my-[24px] p-[16px] bg-gray-50 rounded-[8px] border border-solid border-gray-200">
          <Text className="text-gray-900 text-[14px] leading-[22px] font-bold m-0 mb-[12px]">
            Documentos disponíveis para download:
          </Text>
          {attachmentLinks.map((item, index) => (
            item.url ? (
              <Button
                key={`${item.filename || 'documento'}-${index}`}
                href={item.url}
                className="block bg-emerald-600 text-white text-[13px] font-bold rounded-[6px] px-[14px] py-[10px] mb-[8px] text-center"
              >
                Baixar {item.filename || 'documento'}
              </Button>
            ) : null
          ))}
        </Section>
      )}

      <Text className="text-gray-800 text-[14px] leading-[24px] mt-4">
        Atenciosamente,<br />
        <strong>{nomeEscritorio || SITE_NAME}</strong>
      </Text>
    </EmailLayout>
  )
}

export const template = {
  component: EnvioManualDeclaracaoEmail,
  subject: (data: Record<string, unknown>) => `📄 Declaração IRPF ${data.anoBase || ''} - ${data.nomeEscritorio || SITE_NAME}`,
  displayName: 'Envio manual de declaração',
  previewData: { 
    nomeCliente: 'João Silva', 
    nomeEscritorio: 'Contabilidade ABC', 
    anoBase: '2026',
    mensagemPersonalizada: 'Segue a sua declaração e o recibo de entrega.\nFicamos à disposição para qualquer dúvida.',
    attachmentLinks: [
      { filename: 'Declaracao_IRPF_2026.pdf', url: 'https://example.com/declaracao.pdf' },
      { filename: 'Recibo_IRPF_2026.pdf', url: 'https://example.com/recibo.pdf' },
    ],
  },
} satisfies TemplateEntry

export default EnvioManualDeclaracaoEmail
