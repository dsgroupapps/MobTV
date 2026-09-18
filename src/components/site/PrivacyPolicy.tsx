/**
 * Conteúdo factual — descreve SOMENTE o que o código do site realmente
 * coleta/processa hoje (formulário de lead das páginas de ponto e o
 * analytics first-party dos Blocos A-D). Não inventa prazo de retenção,
 * DPO, endereço, CNPJ, telefone, fundamento jurídico específico ou
 * terceiros que não aparecem no código — onde uma definição jurídica/
 * organizacional da MOBTV ainda está pendente, o texto diz isso
 * explicitamente em vez de presumir um valor.
 */

const sectionEyebrow = "font-mono text-xs uppercase tracking-[0.3em] text-gold-deep mb-3";
const sectionTitle = "font-display font-bold text-ink text-xl sm:text-2xl mb-4";
const paragraph = "text-ink-soft text-base leading-relaxed mb-4";
const listClass = "text-ink-soft text-base leading-relaxed mb-4 list-disc pl-5 space-y-1.5";

export function PrivacyPolicy() {
  return (
    <section className="bg-off-white text-ink py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className={sectionEyebrow}>/ PRIVACIDADE</div>
        <h1 className="font-display font-bold text-ink text-3xl sm:text-4xl leading-tight tracking-tight mb-3">
          Política de Privacidade
        </h1>
        <p className="text-ink-soft/80 text-sm mb-12">
          Última atualização: setembro de 2026. Este texto descreve os dados que o site da MOBTV
          efetivamente coleta hoje — nada além disso.
        </p>

        <p className={paragraph}>
          A MOBTV opera uma rede de mídia digital (telas, painéis e WiFi) no Distrito Federal. Esta
          política se aplica a este site institucional da MOBTV e explica quais dados são tratados
          quando você navega por ele, escaneia um QR Code de um dos nossos pontos físicos, ou
          preenche um dos formulários de contato.
        </p>

        {/* ------------------------------------------------------------ */}
        <h2 className={sectionTitle}>1. Formulário de interesse nas páginas de ponto</h2>
        <p className={paragraph}>
          Cada ponto físico da rede MOBTV tem uma página própria (acessada, entre outras formas,
          pelo QR Code instalado no local). Nela, se você preencher o formulário de interesse,
          enviamos os seguintes dados por e-mail à nossa equipe comercial:
        </p>
        <ul className={listClass}>
          <li>Nome</li>
          <li>Empresa (opcional)</li>
          <li>Um contato para retorno — WhatsApp ou e-mail, conforme o que você informar</li>
          <li>Informações sobre a campanha de interesse (opcional, texto livre)</li>
          <li>
            Contexto técnico do envio: o nome/identificador do ponto associado, o endereço da
            página, a data e hora do envio, e os parâmetros de campanha (UTM) presentes na URL,
            quando existirem
          </li>
        </ul>
        <p className={paragraph}>
          Esses dados são enviados diretamente por e-mail para a equipe comercial da MOBTV — este
          formulário não grava seu nome, empresa ou contato em nenhum banco de dados do site.
        </p>

        {/* ------------------------------------------------------------ */}
        <h2 className={sectionTitle}>2. Formulário da página de Contato</h2>
        <p className={paragraph}>
          O formulário da página de Contato funciona de forma diferente: ele monta uma mensagem de
          WhatsApp pré-preenchida com o que você digitou (nome, empresa, contato e mensagem) e abre
          o WhatsApp para você enviá-la. Os dados desse formulário só chegam até nós se você
          efetivamente enviar a mensagem pelo seu próprio WhatsApp — o site em si não os recebe nem
          os armazena.
        </p>

        {/* ------------------------------------------------------------ */}
        <h2 className={sectionTitle}>3. Dados coletados automaticamente (analytics)</h2>
        <p className={paragraph}>
          O site usa um sistema de analytics próprio (first-party, sem serviços de rastreamento de
          terceiros) para entender a navegação e a eficácia dos QR Codes físicos. Para isso, geramos
          dois identificadores aleatórios guardados no seu navegador:
        </p>
        <ul className={listClass}>
          <li>
            <strong className="text-ink">Um identificador de visitante</strong>, guardado entre
            visitas, e <strong className="text-ink">um identificador de sessão</strong>, válido
            enquanto a aba estiver aberta.
          </li>
        </ul>
        <p className={paragraph}>
          Esses identificadores representam um navegador/dispositivo — não uma pessoa física
          identificada nem garantidamente única. Eles não são cruzados com nome, e-mail ou qualquer
          outro dado pessoal enviado pelos formulários acima.
        </p>
        <p className={paragraph}>Junto com esses identificadores, registramos:</p>
        <ul className={listClass}>
          <li>Qual página/ponto foi acessado, se o acesso veio de um QR Code e qual ponto</li>
          <li>
            A página de origem (referrer), os parâmetros de campanha (UTM) quando presentes na URL,
            e o identificador do QR físico quando presente
          </li>
          <li>
            Categoria do dispositivo (celular, tablet ou computador), sistema operacional e
            navegador — inferidos a partir de informações padrão do navegador, nunca a string bruta
            de identificação do navegador (user-agent)
          </li>
          <li>Idioma e fuso horário configurados no navegador</li>
          <li>Dimensões da tela/janela</li>
          <li>País aproximado, quando disponível pela infraestrutura de rede — nunca o IP</li>
          <li>
            Navegação pelo site e uso do planejador de campanha: abertura de páginas, avanço pelas
            etapas do planejador (seleção de pontos e mídia, resumo da campanha) e solicitações de
            proposta
          </li>
        </ul>

        {/* ------------------------------------------------------------ */}
        <h2 className={sectionTitle}>4. O que não coletamos</h2>
        <ul className={listClass}>
          <li>Não armazenamos o endereço IP bruto de quem visita o site</li>
          <li>Não armazenamos a string bruta de user-agent do navegador</li>
          <li>Não tentamos identificar o modelo exato do seu aparelho</li>
          <li>Não usamos scripts de rastreamento de terceiros (ex. redes de publicidade)</li>
          <li>Não pedimos nem processamos dados de pagamento neste site</li>
        </ul>

        {/* ------------------------------------------------------------ */}
        <h2 className={sectionTitle}>5. Para que usamos esses dados</h2>
        <p className={paragraph}>
          Os dados dos formulários são usados para responder ao seu interesse comercial. Os dados de
          analytics são usados para entender quais pontos da rede geram mais interesse, como as
          pessoas navegam pelo site a partir de um QR Code, e para melhorar o conteúdo e a rede
          MOBTV ao longo do tempo.
        </p>

        {/* ------------------------------------------------------------ */}
        <h2 className={sectionTitle}>6. Onde os dados ficam armazenados</h2>
        <p className={paragraph}>
          Os dados de formulário de interesse são enviados por e-mail através do provedor Resend e
          ficam na caixa de e-mail da nossa equipe comercial. Os dados de analytics ficam
          armazenados no banco de dados do projeto (Supabase), com acesso restrito à equipe técnica
          da MOBTV.
        </p>

        {/* ------------------------------------------------------------ */}
        <h2 className={sectionTitle}>7. Retenção</h2>
        <p className={paragraph}>
          Ainda estamos definindo um prazo formal de retenção para esses dados. Até lá, os dados de
          interesse/lead permanecem na caixa de e-mail da equipe comercial, e os dados de analytics
          permanecem no banco de dados do projeto, sem exclusão automática programada.
        </p>

        {/* ------------------------------------------------------------ */}
        <h2 className={sectionTitle}>8. Seus direitos</h2>
        <p className={paragraph}>
          Você pode entrar em contato pelos canais indicados neste site (WhatsApp e redes sociais no
          rodapé, ou a página de Contato) para pedir informações sobre os dados que descrevemos
          aqui, ou para solicitar sua remoção. Estamos organizando um processo formal para atender
          esses pedidos e atualizaremos esta página assim que ele estiver definido.
        </p>

        {/* ------------------------------------------------------------ */}
        <h2 className={sectionTitle}>9. Alterações desta política</h2>
        <p className={paragraph}>
          Podemos atualizar este texto conforme o site e nossos processos evoluem. A data no topo
          desta página indica a última revisão.
        </p>

        {/* ------------------------------------------------------------ */}
        <h2 className={sectionTitle}>10. Contato</h2>
        <p className={`${paragraph} mb-0`}>
          Dúvidas sobre esta política podem ser enviadas pelos mesmos canais de contato disponíveis
          no site — WhatsApp ou os links de redes sociais no rodapé.
        </p>
      </div>
    </section>
  );
}
