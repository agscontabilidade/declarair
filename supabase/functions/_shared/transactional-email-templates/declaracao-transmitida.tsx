import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface DeclaracaoTransmitidaProps {
  nomeCliente?: string
  nomeEscritorio?: string
  anoBase?: string
  numeroRecibo?: string
  tipoResultado?: string
  valorResultado?: string
  linkPortal?: string
}

const DeclaracaoTransmitidaEmail = ({ nomeCliente, nomeEscritorio, anoBase, numeroRecibo, tipoResultado, valorResultado, linkPortal }: DeclaracaoTransmitidaProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>🎉 Sua declaração IRPF {anoBase || '2025'} foi transmitida com sucesso!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>🎉 Declaração Transmitida!</Heading>
        </Section>

        <Text style={text}>
          Olá <strong>{nomeCliente || 'contribuinte'}</strong>,
        </Text>

        <Text style={text}>
          Temos uma ótima notícia! Sua <strong>Declaração de Imposto de Renda {anoBase || '2025'}</strong> foi transmitida com sucesso pela Receita Federal.
        </Text>

        <Section style={resultBox}>
          {numeroRecibo && <Text style={resultText}>📋 <strong>Recibo:</strong> {numeroRecibo}</Text>}
          {tipoResultado && (
            <Text style={resultText}>
              {tipoResultado === 'restituicao' ? '💰' : tipoResultado === 'pagamento' ? '💳' : '✅'}{' '}
              <strong>Resultado:</strong>{' '}
              {tipoResultado === 'restituicao' ? 'Restituição' : tipoResultado === 'pagamento' ? 'Imposto a pagar' : 'Sem saldo'}
              {valorResultado && ` — R$ ${valorResultado}`}
            </Text>
          )}
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={linkPortal || 'https://declarair.com.br/cliente/dashboard'}>
            Ver Detalhes da Declaração
          </Button>
        </Section>

        <Text style={text}>
          Guarde o número do recibo em local seguro. Ele será necessário para consultas futuras na Receita Federal.
        </Text>

        <Hr style={hr} />

        <Text style={text}>
          Atenciosamente,<br />
          <strong>{nomeEscritorio || SITE_NAME}</strong>
        </Text>

        <Text style={footer}>{SITE_NAME} — Gestão Inteligente de IR para Escritórios Contábeis</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DeclaracaoTransmitidaEmail,
  subject: (data: Record<string, any>) => `🎉 Declaração IRPF ${data.anoBase || '2025'} transmitida com sucesso!`,
  displayName: 'Declaração transmitida',
  previewData: { nomeCliente: 'João Silva', nomeEscritorio: 'Contabilidade ABC', anoBase: '2025', numeroRecibo: '1234.5678.9012-34', tipoResultado: 'restituicao', valorResultado: '2.350,00', linkPortal: 'https://declarair.com.br/cliente/dashboard' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const headerSection = { backgroundColor: '#10B981', padding: '30px 20px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 12px' }
const resultBox = { backgroundColor: '#F0FDF4', border: '1px solid #10B981', padding: '16px', margin: '16px 0', borderRadius: '8px' }
const resultText = { fontSize: '14px', color: '#065F46', margin: '0 0 8px' }
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#1A4F9C', color: '#ffffff', fontWeight: 'bold', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }
const hr = { borderTop: '1px solid #e0e0e0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', textAlign: 'center' as const, margin: '30px 0 0' }
