import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface ConviteClienteProps {
  nomeCliente?: string
  nomeEscritorio?: string
  linkConvite?: string
  mensagemPersonalizada?: string
}

const ConviteClienteEmail = ({ nomeCliente, nomeEscritorio, linkConvite, mensagemPersonalizada }: ConviteClienteProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Acompanhe sua declaração de IR em tempo real — {nomeEscritorio || 'seu escritório'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>📋 Sua Declaração de IR</Heading>
        </Section>

        <Text style={text}>
          Olá <strong>{nomeCliente || 'contribuinte'}</strong>,
        </Text>

        <Text style={text}>
          O <strong>{nomeEscritorio || 'seu escritório contábil'}</strong> criou um acesso exclusivo para você acompanhar sua declaração de Imposto de Renda em tempo real!
        </Text>

        {mensagemPersonalizada && (
          <Section style={messageBox}>
            <Text style={messageText}>
              💬 <strong>Mensagem do contador:</strong><br />
              "{mensagemPersonalizada}"
            </Text>
          </Section>
        )}

        <Text style={text}><strong>Com o Portal do Contribuinte você pode:</strong></Text>
        <Text style={listItem}>📊 Acompanhar o status da sua declaração 24/7</Text>
        <Text style={listItem}>📤 Enviar documentos com segurança total</Text>
        <Text style={listItem}>💬 Chat direto com seu contador</Text>
        <Text style={listItem}>✅ Receber notificações em tempo real</Text>

        <Section style={buttonContainer}>
          <Button style={button} href={linkConvite || '#'}>
            Acessar Minha Declaração
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={text}>
          Atenciosamente,<br />
          <strong>{nomeEscritorio || SITE_NAME}</strong><br />
          <span style={{ fontSize: '12px', color: '#999' }}>via {SITE_NAME}</span>
        </Text>

        <Text style={footer}>{SITE_NAME} — Gestão Inteligente de IR para Escritórios Contábeis</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ConviteClienteEmail,
  subject: (data: Record<string, any>) => `${data.nomeEscritorio || 'Seu escritório'} — Acesse sua Declaração de IR`,
  displayName: 'Convite de cliente',
  previewData: { nomeCliente: 'Ana Costa', nomeEscritorio: 'Contabilidade ABC', linkConvite: 'https://declarair.com.br/cliente/convite/xyz', mensagemPersonalizada: 'Precisamos dos seus informes de rendimento até dia 15.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const headerSection = { backgroundColor: '#1A4F9C', padding: '30px 20px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 12px' }
const listItem = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 4px', paddingLeft: '12px' }
const messageBox = { backgroundColor: '#F0F7FF', borderLeft: '4px solid #1A4F9C', padding: '12px 16px', margin: '16px 0', borderRadius: '4px' }
const messageText = { fontSize: '13px', color: '#1A4F9C', margin: '0' }
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#10B981', color: '#ffffff', fontWeight: 'bold', padding: '14px 28px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }
const hr = { borderTop: '1px solid #e0e0e0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', textAlign: 'center' as const, margin: '30px 0 0' }
