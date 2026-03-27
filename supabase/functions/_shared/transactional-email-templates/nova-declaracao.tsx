import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface NovaDeclaracaoProps {
  nomeCliente?: string
  nomeEscritorio?: string
  anoBase?: string
  linkPortal?: string
}

const NovaDeclaracaoEmail = ({ nomeCliente, nomeEscritorio, anoBase, linkPortal }: NovaDeclaracaoProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Sua declaração IRPF {anoBase || '2025'} foi criada — {nomeEscritorio || 'seu escritório'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>📄 Declaração Criada</Heading>
        </Section>

        <Text style={text}>
          Olá <strong>{nomeCliente || 'contribuinte'}</strong>,
        </Text>

        <Text style={text}>
          Informamos que o <strong>{nomeEscritorio || 'seu escritório contábil'}</strong> iniciou a preparação da sua <strong>Declaração de Imposto de Renda {anoBase || '2025'}</strong>.
        </Text>

        <Text style={text}><strong>Próximos passos:</strong></Text>
        <Text style={listItem}>1️⃣ Envie os documentos necessários pelo portal</Text>
        <Text style={listItem}>2️⃣ Preencha o formulário com seus dados fiscais</Text>
        <Text style={listItem}>3️⃣ Acompanhe o andamento em tempo real</Text>

        <Section style={buttonContainer}>
          <Button style={button} href={linkPortal || 'https://declarair.com.br/cliente/dashboard'}>
            Ver Minha Declaração
          </Button>
        </Section>

        <Section style={infoBox}>
          <Text style={infoText}>
            📌 <strong>Dica:</strong> Quanto antes você enviar os documentos, mais rápido sua declaração ficará pronta. Priorize informes de rendimento, comprovantes médicos e de educação.
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
  component: NovaDeclaracaoEmail,
  subject: (data: Record<string, any>) => `Sua declaração IRPF ${data.anoBase || '2025'} foi criada`,
  displayName: 'Nova declaração criada',
  previewData: { nomeCliente: 'João Silva', nomeEscritorio: 'Contabilidade ABC', anoBase: '2025', linkPortal: 'https://declarair.com.br/cliente/dashboard' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const headerSection = { backgroundColor: '#1A4F9C', padding: '30px 20px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 12px' }
const listItem = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 4px', paddingLeft: '12px' }
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#00C6FF', color: '#1A4F9C', fontWeight: 'bold', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }
const infoBox = { backgroundColor: '#F0FDF4', borderLeft: '4px solid #10B981', padding: '12px 16px', margin: '16px 0', borderRadius: '4px' }
const infoText = { fontSize: '13px', color: '#065F46', margin: '0' }
const hr = { borderTop: '1px solid #e0e0e0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', textAlign: 'center' as const, margin: '30px 0 0' }
