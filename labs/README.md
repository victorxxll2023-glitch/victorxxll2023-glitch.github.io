# Exemplos didáticos Blue Team

Material de estudo criado com apoio de IA para este portfólio. Não documenta um incidente real nem uma experiência profissional do autor. Os nomes, horários, endereços e arquivos são fictícios. O script funciona offline, lê apenas as fixtures deste diretório e não altera arquivos do sistema.

## Reproduzir

Requisito: Python 3.10 ou superior. Nenhuma biblioteca adicional.

```text
python labs/analyze.py
python -m unittest discover -s labs -p "test_*.py"
```

## Autenticação SSH: observar, correlacionar, concluir

**Pergunta:** várias falhas seguidas de um sucesso justificam revisar uma sessão?

**Dados:** `auth-events.json`. Há seis falhas para `ana` de `192.0.2.44`, seguidas de um sucesso em 48 segundos. Outro evento de sucesso pertence a uma conta e origem diferentes. Os endereços são reservados para documentação.

**Método:** ordenar eventos, agrupar por conta e origem, contar falhas anteriores nos últimos 60 segundos. O limiar didático é de cinco falhas; não é uma recomendação de regra para produção. Um sucesso encerra a sequência de falhas daquele grupo.

**Saída esperada:** um achado, seis falhas, 48 segundos, classificação `review_session_not_confirmed_intrusion`.

**Conclusão:** a sequência merece revisão, mas pode representar erro de senha seguido de login legítimo. Precisamos do contexto da conta, da sessão e do endpoint antes de sugerir contenção. Não afirmar que ocorreu brute force ou comprometimento com base apenas nesse padrão.

**Limites:** formato normalizado fictício, sem parser de auth.log real, sem correlação distribuída, NAT ou análise de password spraying. Falhas sem sucesso não são reportadas por esta regra específica.

**Para estudar:** altere o intervalo para mais de 60 segundos e observe o resultado. Mude a conta do sucesso. Explique por que uma origem compartilhada pode gerar falso positivo.

## Integridade: mudança não é necessariamente ataque

**Pergunta:** como identificar conteúdo alterado sem confundir detecção com diagnóstico?

**Dados:** `integrity-files.json`. Uma configuração muda de `debug=false` para `debug=true`; o conteúdo das notas permanece igual. Os caminhos são apenas rótulos, nunca arquivos abertos pelo script.

**Método:** comparar SHA-256 do conteúdo UTF-8 antes e depois.

**Saída esperada:** `config/app.conf` com `changed: true`; `notes/readme.txt` com `changed: false`.

**Conclusão:** houve alteração de conteúdo. Isso não informa quem alterou, por quê ou se houve malware. Preservar as versões, validar a baseline e consultar o processo de mudanças antes de restaurar qualquer arquivo.

**Limites:** não captura permissões, proprietário, metadados, arquivos adicionados/removidos ou mudanças em tempo real. Não é um agente FIM nem uma integração executada com Wazuh.

**Para estudar:** mantenha conteúdos idênticos e confirme que o hash se repete. Documente como autorizaria uma nova baseline após uma mudança legítima.

## Próximo laboratório: Wazuh + Linux

Status: planejado, sem evidências de execução publicadas.

1. Preparar máquinas próprias e isoladas, seguindo requisitos oficiais.
2. Conectar um agente Linux ao Wazuh e verificar a coleta.
3. Gerar eventos controlados e revisar regra, campos e horário.
4. Preservar evidências sanitizadas, explicar falso positivo e próximo passo.
5. Publicar um relatório com objetivo, ambiente, procedimento, evidência, conclusão e limitações.

Não publicar credenciais, IPs públicos, tokens ou dados de terceiros.

## Referências

- [Provas de conceito do Wazuh](https://documentation.wazuh.com/current/proof-of-concept-guide/index.html)
- [Monitoramento de integridade no Wazuh](https://documentation.wazuh.com/current/user-manual/capabilities/file-integrity/index.html)
- [hashlib: documentação Python](https://docs.python.org/3/library/hashlib.html)
- [RFC 5737: endereços para documentação](https://www.rfc-editor.org/rfc/rfc5737)
