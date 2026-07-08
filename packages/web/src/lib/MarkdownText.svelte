<script lang="ts">
  import MarkdownIt from 'markdown-it';

  let {
    value,
    mode = 'block',
  }: {
    value: string;
    mode?: 'inline' | 'block';
  } = $props();

  const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
  });

  function toHtml(text: string, renderMode: 'inline' | 'block'): string {
    if (renderMode === 'inline') {
      return md.renderInline(text);
    }
    return md.render(text);
  }
</script>

{#if value.trim().length > 0}
  {@html toHtml(value, mode)}
{/if}
