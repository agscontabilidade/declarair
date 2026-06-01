import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Button } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface ProcessamentoReceitaConfirmadoProps {
  nomeCliente?: string
  nomeEscritorio?: string
  anoBase?: string
  mensagemPersonalizada?: string
  attachmentLinks?: Array<{ filename?: string; url?: string }>
}

const ProcessamentoReceitaConfirmadoEmail = ({
  nomeCliente,
  nomeEscritorio,
  anoBase,
  mensagemPersonalizada,
  attachmentLinks = [],
}: ProcessamentoReceitaConfirmadoProps) => {
  const lines = mensagemPersonalizada?.split('\n') || []

  const renderBold = (line: string): React.ReactNode[] => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, idx) => {
      const m = /^\*\*([^*]+)\*\*$/.exec(part)
      if (m) return <strong key={idx}>{m[1]}</strong>
      return <React.Fragment key={idx}>{part}</React.Fragment>
    })
  }

  return (
    <EmailLayout
      preview={`✅ Sua declaração IRPF ${anoBase || ''} foi processada pela Receita Federal.`}
      siteName={nomeEscritorio || SITE_NAME}
    >
      <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
        Declaração processada com sucesso
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
            Sua Declaração de Imposto de Renda {anoBase || ''} foi <strong>processada com sucesso pela Receita Federal</strong>.
            Em anexo o documento que comprova o processamento.
          </Text>
        )}
      </Section>

      {attachmentLinks.length > 0 && (
        <Section className="my-[24px] p-[16px] bg-gray-50 rounded-[8px] border border-solid border-gray-200">
          <Text className="text-gray-900 text-[14px] leading-[22px] font-bold m-0 mb-[12px]">
            Comprovação disponível para download:
          </Text>
          {attachmentLinks.map((item, index) =>
            item.url ? (
              <Section key={`${item.filename || 'documento'}-${index}`} style={{ marginBottom: '8px' }}>
                <Button
                  href={item.url}
                  style={{
                    display: 'block',
                    width: '100%',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    textAlign: 'center' as const,
                    boxSizing: 'border-box' as const,
                  }}
                >
                  Baixar {item.filename || 'comprovação'}
                </Button>
              </Section>
            ) : null,
          )}
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
  component: ProcessamentoReceitaConfirmadoEmail,
  subject: (data: Record<string, unknown>) =>
    `✅ Declaração IRPF ${data.anoBase || ''} processada pela Receita - ${data.nomeEscritorio || SITE_NAME}`,
  displayName: 'Processamento Receita Federal confirmado',
  previewData: {
    nomeCliente: 'João Silva',
    nomeEscritorio: 'Contabilidade ABC',
    anoBase: '2026',
    mensagemPersonalizada:
      'Sua Declaração de Imposto de Renda 2026 foi **processada sem erros pela Receita Federal**.\nEm anexo o documento que comprova o processamento.',
    attachmentLinks: [
      { filename: 'Comprovacao_Processamento_IRPF_2026.pdf', url: 'https://example.com/comprovacao.pdf' },
    ],
  },
} satisfies TemplateEntry

export default ProcessamentoReceitaConfirmadoEmail
