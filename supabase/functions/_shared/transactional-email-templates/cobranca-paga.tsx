import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface CobrancaPagaProps {
  nomeCliente?: string
  nomeEscritorio?: string
  descricao?: string
  valor?: string
  dataPagamento?: string
}

const CobrancaPagaEmail = ({ nomeCliente, nomeEscritorio, descricao, valor, dataPagamento }: CobrancaPagaProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>✅ Pagamento de R$ {valor || '0,00'} confirmado — {nomeEscritorio || SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>✅ Pagamento Confirmado</Heading>
        </Section>

        <Text style={text}>
          Olá <strong>{nomeCliente || 'contribuinte'}</strong>,
        </Text>

        <Text style={text}>
          Confirmamos o recebimento do seu pagamento. Obrigado!
        </Text>

        <Section style={detailBox}>
          <Text style={detailText}>📝 <strong>Descrição:</strong> {descricao || 'Serviço contábil'}</Text>
          <Text style={detailText}>💰 <strong>Valor pago:</strong> R$ {valor || '0,00'}</Text>
          <Text style={detailText}>📅 <strong>Data do pagamento:</strong> {dataPagamento || '—'}</Text>
        </Section>

        <Text style={text}>
          Este email serve como comprovante de pagamento. Guarde-o para seus registros.
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
  component: CobrancaPagaEmail,
  subject: (data: Record<string, any>) => `✅ Pagamento de R$ ${data.valor || '0,00'} confirmado`,
  displayName: 'Cobrança paga',
  previewData: { nomeCliente: 'João Silva', nomeEscritorio: 'Contabilidade ABC', descricao: 'Declaração IRPF 2025', valor: '350,00', dataPagamento: '10/04/2025' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const headerSection = { backgroundColor: '#10B981', padding: '30px 20px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 12px' }
const detailBox = { backgroundColor: '#F0FDF4', border: '1px solid #10B981', padding: '16px', margin: '16px 0', borderRadius: '8px' }
const detailText = { fontSize: '14px', color: '#065F46', margin: '0 0 8px' }
const hr = { borderTop: '1px solid #e0e0e0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', textAlign: 'center' as const, margin: '30px 0 0' }
