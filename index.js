import { getContext } from '../../../extensions.js';

const KEY = 'typewriterStartup';
const machineUrl = new URL('./machine.webp', import.meta.url).href;
const markup = `<div class="twext-startup" role="status" aria-live="polite" aria-label="SillyTavern 正在初始化">
    <div class="twext-startup-scene">
        <p class="twext-startup-kicker" aria-hidden="true">THE NEXT CHAPTER AWAITS</p>
        <div class="twext-startup-machine" aria-hidden="true">
            <div class="twext-startup-paper">
                <span class="twext-startup-imprint">EST. IN YOUR IMAGINATION</span>
                <div class="twext-startup-line"><span class="twext-startup-word">SillyTavern</span><i class="twext-startup-caret"></i></div>
            </div>
            <img class="twext-startup-deck" src="${machineUrl}" alt="" width="1536" height="512" fetchpriority="high">
            <i class="twext-startup-strike"></i>
        </div>
        <p class="twext-startup-status">Preparing your story</p>
    </div>
</div>
`;
let initialized = false;
let preview = null;
let previewTimer = null;
let removePreviewKey = null;

function createArtwork() {
    const template = document.createElement('template');
    template.innerHTML = markup.trim();
    return template.content.firstElementChild;
}

function closePreview() {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = null;
    if (removePreviewKey) removePreviewKey();
    removePreviewKey = null;
    const old = preview;
    preview = null;
    if (!old) return;
    old.root.remove();
    if (old.focus?.isConnected) old.focus.focus();
}

function showPreview() {
    closePreview();
    const root = document.createElement('div');
    root.className = 'twext-preview';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', '打字机载入动画预览');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'twext-close';
    button.textContent = '关闭预览 / Close';
    button.addEventListener('click', closePreview);
    root.append(createArtwork(), button);
    preview = { root, focus: document.activeElement };
    document.body.append(root);
    button.focus();
    const onKey = (event) => {
        if (event.key === 'Escape') { event.preventDefault(); closePreview(); }
        else if (event.key === 'Tab') { event.preventDefault(); button.focus(); }
    };
    document.addEventListener('keydown', onKey);
    removePreviewKey = () => document.removeEventListener('keydown', onKey);
    previewTimer = setTimeout(closePreview, 15000);
}

function decorateStartup() {
    // Only the initial splash. Never modify generation/action loading overlays.
    const loader = document.querySelector('#loader.splash-screen');
    if (!loader || loader.querySelector('.twext-startup')) return;
    loader.classList.add('twext-init-loader');
    // Allow safe coexistence with the earlier local source patch.
    loader.querySelector(':scope > .tw-startup')?.remove();
    loader.querySelector(':scope > .splash-logo')?.setAttribute('hidden', '');
    loader.prepend(createArtwork());
    // The native loader retains ownership of dismissal; there is no forced delay.
}

export function init() {
    if (initialized) return;
    initialized = true;
    const context = getContext();
    const settings = context.extensionSettings[KEY] ??= { enabled: true };
    if (settings.enabled !== false) decorateStartup();
    const host = document.querySelector('#extensions_settings2, #extensions_settings');
    if (!host) return;
    const section = document.createElement('div');
    section.id = 'typewriter-startup-settings';
    section.className = 'extension_container';
    section.innerHTML = `<div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header"><b>打字机 · 载入动画</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div>
      <div class="inline-drawer-content">
        <label class="checkbox_label"><input type="checkbox"><span>启用打字机载入动画（刷新后生效）</span></label>
        <small>在扩展加载阶段显示。最初的原生载入画面可能短暂出现；不会延长实际加载时间。预览可按 Esc 或点击关闭，15 秒后自动退出。</small>
        <button type="button" class="menu_button">预览载入动画</button>
      </div></div>`;
    const checkbox = section.querySelector('input');
    checkbox.checked = settings.enabled !== false;
    checkbox.addEventListener('change', () => {
        settings.enabled = checkbox.checked;
        context.saveSettingsDebounced();
    });
    section.querySelector('button').addEventListener('click', showPreview);
    host.append(section);
}
