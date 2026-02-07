/**
 * Popup Handler - Manages the extension popup UI
 * Displays captured sentences with streaming source, timestamps, and sync status
 */
import { DB } from "../Database/DatabaseManager.js";

// DOM Elements
const elements = {
    getCaptionsBtn: document.getElementById('getCaptions'),
    saveWordsBtn: document.getElementById('save-words'),
    clearAllBtn: document.getElementById('clear-all'),
    syncBtn: document.getElementById('sync-btn'),
    sentencesList: document.getElementById('sentences'),
    emptyState: document.getElementById('empty-state'),
    totalSentences: document.getElementById('total-sentences'),
    streamingSource: document.getElementById('streaming-source'),
    syncCount: document.getElementById('sync-count'),
    syncIcon: document.getElementById('sync-icon'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

/**
 * Format timestamp to readable time
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted time string
 */
function formatTime(timestamp) {
    if (!timestamp) return '--:--';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // If less than 24 hours, show time
    if (diff < 86400000) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }
    
    // If less than 7 days, show day and time
    if (diff < 604800000) {
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

/**
 * Get streaming badge class based on source
 * @param {string} source - Streaming source name
 * @returns {string} CSS class for the badge
 */
function getStreamingClass(source) {
    const sourceMap = {
        'netflix': 'netflix',
        'youtube': 'youtube',
        'amazon prime video': 'primevideo',
        'disney+': 'disneyplus',
        'max (hbo)': 'max',
        'star+': 'starplus'
    };
    
    return sourceMap[source?.toLowerCase()] || '';
}

/**
 * Create sentence card HTML
 * @param {Object} sentence - Sentence data object
 * @returns {string} HTML string for the sentence card
 */
function createSentenceCard(sentence) {
    const streamingClass = getStreamingClass(sentence.source);
    const timeFormatted = formatTime(sentence.timestamp);
    const syncStatus = sentence.synced ? '✅' : '⏳';
    
    // Determina o estado da tradução
    let translationContent = '';
    if (!sentence.synced) {
        translationContent = `
            <div class="translation-not-sent">
                <span>⚠️</span>
                <span>Frase não enviada</span>
            </div>
        `;
    } else if (sentence.translation) {
        // Tradução recebida
        let explanationHtml = '';
        if (sentence.explanation) {
            explanationHtml = `
                <div class="translation-explanation">
                    <span class="explanation-label">💡</span>
                    <span>${escapeHtml(sentence.explanation)}</span>
                </div>
            `;
        }
        translationContent = `
            <div class="translation-main translation-loaded">
                <span class="translation-label">🌐</span>
                <span class="translation-text">${escapeHtml(sentence.translation)}</span>
            </div>
            ${explanationHtml}
        `;
    } else if (sentence.translationPending) {
        // Aguardando tradução da IA
        translationContent = `
            <div class="translation-loading">
                <span class="loading-spinner"></span>
                <span>Traduzindo...</span>
            </div>
        `;
    } else {
        // Sincronizado mas sem tradução ainda
        translationContent = `
            <div class="translation-loading">
                <span class="loading-spinner"></span>
                <span>Aguardando tradução...</span>
            </div>
        `;
    }
    
    return `
        <li class="sentence-card ${sentence.synced ? 'synced' : 'pending'}" data-key="${sentence.key}" data-phrase-id="${sentence.phraseId || ''}">
            <div class="sentence-header">
                <span class="streaming-badge ${streamingClass}">
                    🎬 ${sentence.source || 'Unknown'}
                </span>
                <div class="sentence-meta">
                    <span class="sync-indicator" title="${sentence.synced ? 'Synced' : 'Pending sync'}">${syncStatus}</span>
                    <span class="sentence-time">🕐 ${timeFormatted}</span>
                </div>
            </div>
            <div class="sentence-text">${escapeHtml(sentence.text)}</div>
            <div class="translation-content">
                ${translationContent}
            </div>
        </li>
    `;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, info)
 */
function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2500);
}

/**
 * Update sync status display
 * @param {Array} sentences - Array of sentence objects
 */
function updateSyncStatus(sentences) {
    const synced = sentences.filter(s => s.synced).length;
    const pending = sentences.length - synced;
    
    if (pending > 0) {
        elements.syncCount.textContent = `${pending}`;
        elements.syncIcon.textContent = '⏳';
        elements.syncBtn.classList.add('has-pending');
    } else {
        elements.syncCount.textContent = synced > 0 ? '✓' : '--';
        elements.syncIcon.textContent = '☁️';
        elements.syncBtn.classList.remove('has-pending');
    }
}

/**
 * Update the UI with sentences data
 * @param {Array} sentences - Array of sentence objects
 */
function updateUI(sentences) {
    // Update stats
    elements.totalSentences.textContent = sentences.length;
    
    // Get sources
    if (sentences.length > 0) {
        const sources = [...new Set(sentences.map(s => s.source))];
        elements.streamingSource.textContent = sources.length > 1 
            ? `${sources.length}` 
            : (sources[0] || '--');
    } else {
        elements.streamingSource.textContent = '--';
    }
    
    // Update sync status
    updateSyncStatus(sentences);
    
    // Show/hide empty state
    if (sentences.length === 0) {
        elements.sentencesList.innerHTML = '';
        elements.emptyState.style.display = 'flex';
    } else {
        elements.emptyState.style.display = 'none';
        elements.sentencesList.innerHTML = sentences
            .map(createSentenceCard)
            .join('');
    }
}

/**
 * Load and display all sentences
 */
function loadSentences() {
    chrome.runtime.sendMessage({ type: "getAllSentences" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error loading sentences:", chrome.runtime.lastError);
            showToast("Error loading sentences", "error");
            return;
        }

        if (!response || !response.data) {
            updateUI([]);
            return;
        }

        // Convert object to sorted array
        const sentences = Object.entries(response.data)
            .map(([key, value]) => {
                // Handle both old format (string) and new format (object)
                if (typeof value === 'string') {
                    return { key, text: value, source: 'Unknown', timestamp: null, synced: false };
                }
                return { key, ...value };
            })
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        updateUI(sentences);
    });
}

/**
 * Sync pending sentences with backend
 */
function syncPending() {
    elements.syncBtn.disabled = true;
    elements.syncIcon.textContent = '🔄';
    showToast("Syncing...", "info");

    chrome.runtime.sendMessage({ type: "syncPending" }, (response) => {
        elements.syncBtn.disabled = false;
        
        if (response && response.success) {
            if (response.synced > 0) {
                showToast(`Synced ${response.synced} sentences!`);
            } else if (response.total === 0) {
                showToast("All sentences already synced!", "info");
            } else {
                showToast(`Sync failed for ${response.failed} sentences`, "error");
            }
            loadSentences(); // Reload to update sync status
        } else {
            showToast("Sync failed", "error");
            elements.syncIcon.textContent = '⚠️';
        }
    });
}

/**
 * Clear all sentences
 */
function clearAllSentences() {
    if (confirm('Are you sure you want to clear all sentences?')) {
        chrome.runtime.sendMessage({ type: "clearAllSentences" }, (response) => {
            updateUI([]);
            showToast("All sentences cleared!");
        });
    }
}

/**
 * Trigger caption capture on current tab
 */
function triggerCapture() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab && tab.url) {
            const supportedSites = [
                'youtube.com',
                'netflix.com',
                'primevideo.com',
                'disneyplus.com',
                'hbomax.com',
                'starplus.com'
            ];
            
            const isSupported = supportedSites.some(site => tab.url.includes(site));
            
            if (isSupported) {
                // Using the specific loader for the content script
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['src/Content/loader.js']
                });
                showToast("Capture mode activated!");
            } else {
                showToast("Not on a supported streaming site", "error");
            }
        }
    });
}

// Event Listeners
elements.getCaptionsBtn.addEventListener('click', triggerCapture);
elements.saveWordsBtn.addEventListener('click', () => {
    loadSentences();
    showToast("Sentences loaded!", "info");
});
elements.syncBtn.addEventListener('click', syncPending);
elements.clearAllBtn.addEventListener('click', clearAllSentences);

// Listen for translation notifications from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== 'popup-notification') return;

    switch (message.event) {
        case 'translation-received':
            console.log('[Popup] Translation received:', message.data);
            updateCardWithTranslation(message.data);
            break;

        case 'translation-error':
            console.log('[Popup] Translation error:', message.data);
            updateCardWithError(message.data);
            break;
    }
});

/**
 * Atualiza card com tradução recebida
 * @param {Object} data - Dados da tradução
 */
function updateCardWithTranslation(data) {
    const card = document.querySelector(`[data-phrase-id="${data.phrase_id}"]`);
    if (!card) {
        console.log('[Popup] Card not found for phrase:', data.phrase_id);
        return;
    }

    const translationDiv = card.querySelector('.translation-content');
    if (!translationDiv) return;

    let html = `
        <div class="translation-main">
            <span class="translation-label">🌐</span>
            <span class="translation-text">${escapeHtml(data.traducao_completa)}</span>
        </div>
    `;

    if (data.explicacao) {
        html += `
            <div class="translation-explanation">
                <span class="explanation-label">💡</span>
                <span>${escapeHtml(data.explicacao)}</span>
            </div>
        `;
    }

    translationDiv.innerHTML = html;
    translationDiv.classList.add('translation-loaded');
    showToast("Tradução recebida!", "success");
}

/**
 * Atualiza card com erro de tradução
 * @param {Object} data - Dados do erro
 */
function updateCardWithError(data) {
    const card = document.querySelector(`[data-phrase-id="${data.phrase_id}"]`);
    if (!card) return;

    const translationDiv = card.querySelector('.translation-content');
    if (!translationDiv) return;

    translationDiv.innerHTML = `
        <div class="translation-error">
            <span>❌</span>
            <span>Erro ao traduzir</span>
        </div>
    `;
}

// Load sentences on popup open
document.addEventListener('DOMContentLoaded', loadSentences);
