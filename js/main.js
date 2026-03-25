// ===== THEME =====
const themeBtn = document.getElementById('theme-btn');
let darkMode = false;

function toggleTheme() {
  darkMode = !darkMode;
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  themeBtn.textContent = darkMode ? '☀️' : '🌙';
}

// ===== ROUTING =====
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

  const page = document.getElementById('page-' + name);
  const navEl = document.getElementById('nav-' + name);

  if (page) { page.classList.add('active'); window.scrollTo(0, 0); }
  if (navEl) navEl.classList.add('active');
}

// ===== MOBILE MENU =====
let mobileOpen = false;
function toggleMobile() {
  mobileOpen = !mobileOpen;
  document.getElementById('mobile-menu').classList.toggle('open', mobileOpen);
}

// ===== FORM =====
function submitForm() {
  const fname = document.getElementById('f-fname').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const msg = document.getElementById('f-msg').value.trim();

  if (!fname || !email || !msg) {
    alert('Please fill in your name, email, and message.');
    return;
  }

  document.getElementById('contact-form').style.display = 'none';
  document.getElementById('form-success').style.display = 'block';
}

// ===== CHATBOT =====
let chatOpen = false;
let chatHistory = [];
let notifSeen = false;

const COMPANY_CONTEXT = `You are Nova, a friendly and warm AI assistant for Neurodivergence Revived CIC — a UK-based community interest company (not-for-profit) that supports neurodivergent children, young adults, and their families.

ABOUT THE ORGANISATION:
- Founded by a parent of a son on the autism spectrum
- Focused on autism, ADHD, and all forms of neurodivergence
- Driven by impact, not profit

THREE KEY SERVICES:
1. Parent & Carer Support & Advocacy: Help with EHCP/special needs applications, school meetings, multi-agency meetings, navigating education, health and social services, and college/workplace support for young adults.
2. Buddy & Mentorship Programme: Pairs neurodivergent young adults and adults (ages 14–35) with neurotypical peer mentors of a similar age. Both in-person and online. Flexible sessions. Referrals welcome from partner organisations.
3. Creative & Skills Development Workshops: Fine Art, Music, ICT & Digital Skills, Graphic Design. Tailored, short, practical, and accessible sessions.

VOLUNTEERING: We need volunteers aged 18+ to be mentor-buddies. Training is provided. No prior experience needed. Flexible commitment.

CONTACT: Email neurodivergencerevived@gmail.com or use the contact form on the website. Website: neurodivergencerevived.org

TONE: Be warm, empathetic, encouraging, and clear. Keep responses concise (2-4 sentences max unless more detail is genuinely needed). If unsure about something specific, invite them to email or use the contact form. Never make up specific dates, numbers, or facts not given above.`;

function toggleChat() {
  chatOpen = !chatOpen;
  const win = document.getElementById('chat-window');
  win.classList.toggle('open', chatOpen);
  document.getElementById('chat-fab-icon').textContent = chatOpen ? '✕' : '💬';

  if (chatOpen && !notifSeen) {
    document.getElementById('chat-notif').style.display = 'none';
    notifSeen = true;
  }

  if (chatOpen && chatHistory.length === 0) {
    setTimeout(() => addBotMessage("Hi there! 👋 I'm Nova, the Neurodivergence Revived assistant. I'm here to help you find out about our services, mentorship programme, workshops, or how to get involved. What can I help you with today?"), 500);
  }

  if (chatOpen) {
    setTimeout(() => document.getElementById('chat-input').focus(), 350);
  }
}

function addBotMessage(text, isTyping = false) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg msg-bot';

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isTyping) {
    div.id = 'typing-indicator';
    div.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  } else {
    div.innerHTML = `<div class="msg-bubble">${text}</div><div class="msg-time">${time}</div>`;
  }

  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function addUserMessage(text) {
  const msgs = document.getElementById('chat-messages');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.className = 'msg msg-user';
  div.innerHTML = `<div class="msg-bubble">${text}</div><div class="msg-time">${time}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function hideQuickReplies() {
  document.getElementById('quick-replies').style.display = 'none';
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  hideQuickReplies();
  input.value = '';
  addUserMessage(text);

  chatHistory.push({ role: 'user', content: text });

  const sendBtn = document.getElementById('chat-send-btn');
  sendBtn.disabled = true;

  const typingEl = addBotMessage('', true);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: COMPANY_CONTEXT,
        messages: chatHistory
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || "I'm sorry, I couldn't process that. Please try again or email us at neurodivergencerevived@gmail.com";

    typingEl.remove();
    addBotMessage(reply);

    chatHistory.push({ role: 'assistant', content: reply });
  } catch (err) {
    typingEl.remove();
    addBotMessage("I'm having a little trouble connecting right now. Please email us at <a href='mailto:neurodivergencerevived@gmail.com' style='color:var(--purple)'>neurodivergencerevived@gmail.com</a> and we'll get back to you promptly! 💜");
  }

  sendBtn.disabled = false;
}

function sendQuick(text) {
  document.getElementById('chat-input').value = text;
  sendMessage();
}

// Show notif bubble after 3s
setTimeout(() => {
  if (!chatOpen && !notifSeen) {
    document.getElementById('chat-notif').style.display = 'block';
  }
}, 3000);