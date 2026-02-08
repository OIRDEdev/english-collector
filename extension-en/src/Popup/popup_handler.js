/**
 * Popup Handler - Manages the extension popup UI
 * Displays captured sentences with streaming source, timestamps, and sync status
 */
// DOM Elements
const elements = {
    // Nav Buttons
    navList: document.getElementById('nav-list'),
    navSync: document.getElementById('nav-sync'),
    navAnalyze: document.getElementById('nav-analyze'),
    navConfig: document.getElementById('nav-config'),
    navCapture: document.getElementById('nav-capture'),
    
    // Tab Contents
    tabList: document.getElementById('tab-content-list'),
    tabSync: document.getElementById('tab-content-sync'),
    tabAnalyze: document.getElementById('tab-content-analyze'),
    tabConfig: document.getElementById('tab-content-config'),

    // Content Areas
    sentencesList: document.getElementById('sentences-list'),
    emptyState: document.getElementById('empty-state'),
    
    // Sync specific
    syncBtn: document.getElementById('sync-btn'),
    // syncCount: document.getElementById('sync-count-info'), 
    
    // Config specific
    clearAllBtn: document.getElementById('clear-all'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),

    // Start Capture Button (in empty state)
    startCaptureBtn: document.getElementById('btn-start-capture')
};

// State
let currentTab = 'list';

/**
 * Format timestamp to time or date
 */
function formatTime(timestamp) {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get source CSS class
 */
function getSourceClass(source) {
    const map = {
        'netflix': 'source-netflix',
        'youtube': 'source-youtube',
        'amazon': 'source-amazon',
        'disney': 'source-disney',
        'unknown': 'source-unknown'
    };
    const key = (source || 'unknown').toLowerCase().split(' ')[0];
    return map[key] || 'source-unknown';
}

/**
 * Switch Tab Function
 */
function switchTab(tabId) {
    // Deactivate all
    document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Activate target
    const targetBtn = document.getElementById(`nav-${tabId}`);
    const targetContent = document.getElementById(`tab-content-${tabId}`);

    if (targetBtn && targetContent) {
        targetBtn.classList.add('active');
        targetContent.classList.add('active');
        currentTab = tabId;
    }
}

/**
 * Create Sentence Card HTML
 */
function createSentenceCard(sentence) {
    const sourceClass = getSourceClass(sentence.source);
    const timeFormatted = formatTime(sentence.timestamp);

    // Translation Logic
    let translationHtml = '';
   
    if (sentence.translation) {
        translationHtml = `
            <div class="translation-content" id="trans-${sentence.key}">
                <div class="translation-row">
                    <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1 14h6m-3-3v3M7 21l.5-1.5M7 21l-.5-1.5"></path></svg>
                    <p class="translation-text">"${escapeHtml(sentence.translation)}"</p>
                </div>
                ${sentence.explanation ? `<p class="translation-text" style="font-size: 0.75rem; margin-top: 5px;">💡 ${escapeHtml(sentence.explanation)}</p>` : ''}
            </div>
        `;
    } else if (sentence.translationPending) {
        translationHtml = `
             <div class="translation-content" id="trans-${sentence.key}">
                <p class="translation-text">Traduzindo...</p>
            </div>
        `;
    }

    return `
        <div class="phrase-item" data-key="${sentence.key}">
            <div class="card-content">
                <div class="card-header">
                    <span class="source-badge ${sourceClass}">${sentence.source || 'Unknown'}</span>
                    <span class="timestamp">${timeFormatted}</span>
                </div>
                <p class="phrase-text">"${escapeHtml(sentence.text)}"</p>
                
                <div class="card-actions">
                    <button class="action-link toggle-trans-btn" data-target="trans-${sentence.key}">
                        <svg class="w-3 h-3 transform transition-transform" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        Ver tradução
                    </button>
                    ${sentence.synced ? '<span style="font-size: 10px; color: var(--success-color);">☁️ Salvo</span>' : ''}
                </div>
            </div>
            ${translationHtml}
        </div>
    `;
}

/**
 * Toggle Translation Visibility
 */
function toggleTranslation(targetId, btn) {
    const content = document.getElementById(targetId);
    if (!content) return;

    // Close others? Optional.
    document.querySelectorAll('.translation-content').forEach(el => {
        if (el.id !== targetId) el.classList.remove('show');
    });

    content.classList.toggle('show');
    
    // Rotate icon
    const icon = btn.querySelector('svg');
    if (icon) {
        if (content.classList.contains('show')) {
            icon.style.transform = 'rotate(180deg)';
        } else {
            icon.style.transform = 'rotate(0deg)';
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type} show`;
    setTimeout(() => {
        elements.toast.className = 'toast'; // hide
    }, 2500);
}

/**
 * Load Sentences
 */
function loadSentences() {
    chrome.runtime.sendMessage({ type: "getAllSentences" }, (response) => {
        if (!response || !response.data) {
            updateUI([]);
            return;
        }

        const sentences = Object.entries(response.data)
            .map(([key, value]) => ({ key, ...value }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        updateUI(sentences);
    });
}

function updateUI(sentences) {
    if (sentences.length === 0) {
        elements.sentencesList.innerHTML = '';
        elements.emptyState.style.display = 'block';
    } else {
        elements.emptyState.style.display = 'none';
        elements.sentencesList.innerHTML = sentences.map(createSentenceCard).join('');
        
        // Re-attach event listeners for dynamic buttons
        document.querySelectorAll('.toggle-trans-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = btn.getAttribute('data-target');
                toggleTranslation(targetId, btn);
            });
        });
    }
}

/**
 * Capture Logic
 */
function triggerCapture() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab && tab.url) {
             // Basic support check
             chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['src/Content/loader.js']
            }, () => {
                if (chrome.runtime.lastError) {
                    showToast("Erro ao injetar script", "error");
                } else {
                    showToast("Modo de captura ativado!");
                }
            });
        }
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSentences();

    // Tabs
    if(elements.navList) elements.navList.addEventListener('click', () => switchTab('list'));
    if(elements.navSync) elements.navSync.addEventListener('click', () => switchTab('sync'));
    if(elements.navAnalyze) elements.navAnalyze.addEventListener('click', () => switchTab('analyze'));
    if(elements.navConfig) elements.navConfig.addEventListener('click', () => switchTab('config'));

    // Actions
    if(elements.navCapture) elements.navCapture.addEventListener('click', triggerCapture);
    if(elements.startCaptureBtn) elements.startCaptureBtn.addEventListener('click', triggerCapture);
    
    if(elements.clearAllBtn) {
        elements.clearAllBtn.addEventListener('click', () => {
            if(confirm("Tem certeza que deseja limpar tudo?")) {
                chrome.runtime.sendMessage({ type: "clearAllSentences" }, () => {
                    loadSentences();
                    showToast("Tudo limpo!");
                });
            }
        });
    }

    if(elements.syncBtn) {  
        elements.syncBtn.addEventListener('click', () => {
            showToast("Sincronizando...", "info");
            chrome.runtime.sendMessage({ type: "syncPending" }, (res) => {
                if (res && res.success) {
                    showToast(`Sincronizado: ${res.synced} frases!`);
                    loadSentences();
                } else {
                    showToast("Falha na sincronização", "error");
                }
            });
        });
    }
});

// Listener for updates
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'popup-notification') {
        if (message.event === 'translation-received' || message.event === 'translation-error') {
            loadSentences(); // Reload to show new state
        }
    }
});
