import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Section } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface AvisoCobrancaProps {
  nomeCliente?: string
  nomeEscritorio?: string
  descricao?: string
  valor?: string
  dataVencimento?: string
  diasAtraso?: number
  chavePix?: string
  linkPortal?: string
  mensagemPersonalizada?: string
  statusLabel?: string
}

const AvisoCobrancaEmail = ({
  nomeCliente,
  nomeEscritorio,
  descricao,
  valor,
  dataVencimento,
  diasAtraso = 0,
  chavePix,
  linkPortal,
  mensagemPersonalizada,
  statusLabel,
}: AvisoCobrancaProps) => {
  const atrasado = diasAtraso > 0
  const headerLabel = statusLabel || (atrasado ? 'Cobrança em Atraso' : 'Cobrança Pendente')
  const accentBg = atrasado ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
  const accentText = atrasado ? 'text-red-800' : 'text-amber-800'

  return (
    <EmailLayout
      preview={`${headerLabel}: R$ ${valor || '0,00'} — vencimento ${dataVencimento || '—'}`}
      siteName={nomeEscritorio || SITE_NAME}
    >
      <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
        {headerLabel}
      </Heading>

      <Text className="text-gray-800 text-[14px] leading-[24px]">
        Olá <strong>{nomeCliente || 'contribuinte'}</strong>,
      </Text>

      {mensagemPersonalizada ? (
        <Text className="text-gray-800 text-[14px] leading-[24px] whitespace-pre-line">
          {mensagemPersonalizada}
        </Text>
      ) : (
        <Text className="text-gray-800 text-[14px] leading-[24px]">
          {atrasado
            ? 'Identificamos que a cobrança abaixo está em atraso. Por favor, regularize assim que possível.'
            : 'Este é um lembrete amigável sobre uma cobrança pendente:'}
        </Text>
      )}

      <Section className={`${accentBg} border rounded-lg p-[16px] my-[24px]`}>
        <Text className={`${accentText} text-[14px] leading-[22px] m-0 mb-2`}>
          📝 <strong>Descrição:</strong> {descricao || 'Serviço contábil'}
        </Text>
        <Text className={`${accentText} text-[14px] leading-[22px] m-0 mb-2`}>
          💰 <strong>Valor:</strong> R$ {valor || '0,00'}
        </Text>
        <Text className={`${accentText} text-[14px] leading-[22px] m-0 mb-2`}>
          📅 <strong>Vencimento:</strong> {dataVencimento || '—'}
        </Text>
        {atrasado && (
          <Text className={`${accentText} text-[14px] leading-[22px] m-0`}>
            ⏰ <strong>Dias em atraso:</strong> {diasAtraso}
          </Text>
        )}
      </Section>

      {chavePix && (
        <Section className="bg-emerald-50 border border-emerald-200 rounded-lg p-[16px] my-[16px]">
          <Text className="text-emerald-800 text-[14px] leading-[22px] m-0 mb-1">
            🔑 <strong>Chave Pix para pagamento:</strong>
          </Text>
          <Text className="text-emerald-900 text-[14px] font-mono m-0 break-all">
            {chavePix}
          </Text>
        </Section>
      )}

      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-3"
          href={linkPortal || 'https://declarair.com.br/cliente/dashboard'}
        >
          Acessar Portal
        </Button>
      </Section>

      <Text className="text-gray-600 text-[12px] leading-[20px] italic mt-4">
        Caso o pagamento já tenha sido efetuado, por favor desconsidere este aviso.
      </Text>

      <Text className="text-gray-800 text-[14px] leading-[24px] mt-4">
        Atenciosamente,<br />
        <strong>{nomeEscritorio || SITE_NAME}</strong>
      </Text>
    </EmailLayout>
  )
}

export const template = {
  component: AvisoCobrancaEmail,
  subject: (data: Record<string, unknown>) => {
    const atrasado = typeof data.diasAtraso === 'number' && data.diasAtraso > 0
    const prefix = atrasado ? 'Cobrança em atraso' : 'Lembrete de cobrança'
    return `${prefix}: R$ ${data.valor || '0,00'} — venc. ${data.dataVencimento || '—'}`
  },
  displayName: 'Aviso de cobrança',
  previewData: {
    nomeCliente: 'João Silva',
    nomeEscritorio: 'Contabilidade ABC',
    descricao: 'Honorários — Declaração IRPF 2026',
    valor: '350,00',
    dataVencimento: '15/04/2026',
    diasAtraso: 5,
    chavePix: 'contato@contabilidadeabc.com.br',
    linkPortal: 'https://declarair.com.br/cliente/dashboard',
    mensagemPersonalizada: '',
    statusLabel: 'Cobrança em Atraso',
  },
} satisfies TemplateEntry

export default AvisoCobrancaEmail
