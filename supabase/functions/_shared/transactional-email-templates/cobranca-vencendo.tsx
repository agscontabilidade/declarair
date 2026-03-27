import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface CobrancaVencendoProps {
  nomeCliente?: string
  nomeEscritorio?: string
  descricao?: string
  valor?: string
  dataVencimento?: string
  linkPagamento?: string
}

const CobrancaVencendoEmail = ({ nomeCliente, nomeEscritorio, descricao, valor, dataVencimento, linkPagamento }: CobrancaVencendoProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Lembrete: cobrança vencendo em breve — R$ {valor || '0,00'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>⏰ Cobrança Próxima do Vencimento</Heading>
        </Section>

        <Text style={text}>
          Olá <strong>{nomeCliente || 'contribuinte'}</strong>,
        </Text>

        <Text style={text}>
          Este é um lembrete sobre uma cobrança que está próxima do vencimento:
        </Text>

        <Section style={detailBox}>
          <Text style={detailText}>📝 <strong>Descrição:</strong> {descricao || 'Serviço contábil'}</Text>
          <Text style={detailText}>💰 <strong>Valor:</strong> R$ {valor || '0,00'}</Text>
          <Text style={detailText}>📅 <strong>Vencimento:</strong> {dataVencimento || '—'}</Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={linkPagamento || 'https://declarair.com.br/cliente/dashboard'}>
            Pagar Agora
          </Button>
        </Section>

        <Section style={warningBox}>
          <Text style={warningText}>
            ⚠️ Evite juros e multas realizando o pagamento antes do vencimento.
          </Text>
        </Section>

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
  component: CobrancaVencendoEmail,
  subject: (data: Record<string, any>) => `Lembrete: cobrança de R$ ${data.valor || '0,00'} vencendo em ${data.dataVencimento || 'breve'}`,
  displayName: 'Cobrança vencendo',
  previewData: { nomeCliente: 'João Silva', nomeEscritorio: 'Contabilidade ABC', descricao: 'Declaração IRPF 2025', valor: '350,00', dataVencimento: '15/04/2025', linkPagamento: 'https://declarair.com.br/cliente/dashboard' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const headerSection = { backgroundColor: '#F59E0B', padding: '30px 20px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 12px' }
const detailBox = { backgroundColor: '#FFFBEB', border: '1px solid #F59E0B', padding: '16px', margin: '16px 0', borderRadius: '8px' }
const detailText = { fontSize: '14px', color: '#92400E', margin: '0 0 8px' }
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#10B981', color: '#ffffff', fontWeight: 'bold', padding: '14px 28px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }
const warningBox = { backgroundColor: '#FEF3C7', borderLeft: '4px solid #F59E0B', padding: '12px 16px', margin: '16px 0', borderRadius: '4px' }
const warningText = { fontSize: '13px', color: '#92400E', margin: '0' }
const hr = { borderTop: '1px solid #e0e0e0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', textAlign: 'center' as const, margin: '30px 0 0' }
