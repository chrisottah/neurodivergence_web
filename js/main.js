// ============================================================
// CONFIGURATION — replace these with your real keys
// ============================================================
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const RECAPTCHA_SITE_KEY  = 'YOUR_RECAPTCHA_SITE_KEY';
// ============================================================

// Initialise EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// ===== THEME =====
let darkMode = false;
function toggleTheme() {
  darkMode = !darkMode;
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.setAttribute('data-lucide', darkMode ? 'sun' : 'moon');
    lucide.createIcons();
  }
}

// ===== ROUTING =====
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const page  = document.getElementById('page-' + name);
  const navEl = document.getElementById('nav-' + name);
  if (page)  { page.classList.add('active'); window.scrollTo(0, 0); }
  if (navEl) navEl.classList.add('active');
}

// ===== MOBILE MENU =====
let mobileOpen = false;
function toggleMobile() {
  mobileOpen = !mobileOpen;
  document.getElementById('mobile-menu').classList.toggle('open', mobileOpen);
}

// ===== CONTACT FORM — EmailJS + reCAPTCHA v3 + Honeypot =====
async function submitForm() {
  const btn      = document.getElementById('submit-btn');
  const errorDiv = document.getElementById('form-error');

  // Honeypot — silently reject bots
  if (document.getElementById('hp-name').value.trim()) return;

  const fname = document.getElementById('f-fname').value.trim();
  const lname = document.getElementById('f-lname').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const msg   = document.getElementById('f-msg').value.trim();

  errorDiv.style.display = 'none';
  errorDiv.textContent   = '';

  if (!fname || !email || !msg) {
    errorDiv.textContent   = 'Please fill in your name, email address, and message.';
    errorDiv.style.display = 'block';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorDiv.textContent   = 'Please enter a valid email address.';
    errorDiv.style.display = 'block';
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Sending…';

  try {
    const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'contact_form' });
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      from_name:        `${fname} ${lname}`.trim(),
      from_email:       email,
      enquiry_type:     document.getElementById('f-type').value    || 'Not specified',
      service_interest: document.getElementById('f-service').value || 'Not specified',
      message:          msg,
      recaptcha_token:  token,
    });
    document.getElementById('contact-form').style.display = 'none';
    document.getElementById('form-success').style.display = 'block';
    lucide.createIcons();
  } catch (err) {
    console.error('EmailJS error:', err);
    errorDiv.textContent   = 'Something went wrong. Please email us directly at neurodivergencerevived@gmail.com';
    errorDiv.style.display = 'block';
    btn.disabled    = false;
    btn.textContent = 'Send Message →';
  }
}

// ============================================================
// CHATBOT
// ============================================================

let chatInitiated   = false;
let chatOpen        = false;
let conversationHistory = [];
let isTyping        = false;
let notifSeen       = false;

const NOVA_CONTEXT = `
You are Nova, a warm and empathetic AI assistant for Neurodivergence Revived CIC — a UK-based community interest company (not-for-profit). You represent the organisation with care, clarity, and compassion.

# YOUR PRIMARY GOALS
1. Help visitors understand what Neurodivergence Revived does
2. Guide families, young adults, and volunteers to the right service
3. Encourage them to get in touch via the contact form or email
4. Make every visitor feel seen, welcomed, and supported

# ABOUT NEURODIVERGENCE REVIVED CIC
- Founded by Essie Rewane, a parent of a son on the autism spectrum
- Supports neurodivergent children, young adults (aged 14–35), and their families
- Focused on autism, ADHD, dyslexia, and all forms of neurodivergence
- UK-based, not-for-profit — driven by impact, not profit
- Registered Community Interest Company (CIC)

# THREE CORE SERVICES

## 1. Parent, Carer & Individual Support / Advocacy
- Help with EHCP (Education, Health and Care Plan) and special needs applications
- Attending school and multi-agency meetings alongside families
- Navigating education, health, and social services
- Support for young adults transitioning into college or the workplace
- Workshops and peer support networks for parents and carers

## 2. Buddy & Mentorship Programme (ages 14–35)
- Carefully matched neurotypical peer mentors of a similar age
- Sessions available in-person, online, or both
- Builds confidence, independence, social and communication skills
- Referrals welcome from partner organisations, schools, and professionals
- To register: email neurodivergencerevived@gmail.com or use the contact form

## 3. Creative & Skills Development Workshops
- Fine Art, Music, ICT & Digital Skills, Graphic Design
- Short, practical, accessible, go-at-your-own-pace
- Pathways to employment or entrepreneurship

# VOLUNTEERING
- Volunteers aged 18+ needed to become mentor-buddies
- No prior experience — full training provided
- Flexible commitment, in-person or online

# CONTACT
- Email: neurodivergencerevived@gmail.com
- Website: neurodivergencerevived.org
- Contact form available on the website

# TONE
- Warm, empathetic, human — this audience is often going through something difficult
- Clear and accessible — avoid jargon
- Encouraging without being patronising
- Always end with a gentle next step
- Never give medical or legal advice
- Never make up facts not listed above
- Keep responses concise — 2 to 4 short paragraphs maximum
`;

// ---- Pattern-matching (fast, no API needed) ----
function getLocalResponse(msg) {
  const m = msg.toLowerCase();

  if (m.match(/^(hi|hello|hey|good morning|good afternoon|good evening|hiya|howdy)/i)) {
    return `Hello! 👋 I'm Nova, the Neurodivergence Revived assistant.\n\nI'm here to help you find out about our services, mentorship programme, workshops, or how to volunteer. What brings you here today?`;
  }
  if (m.includes('what is') || m.includes('who are') || m.includes('about you') || m.includes('tell me about') || m.includes('what do you do')) {
    return `Neurodivergence Revived CIC is a UK-based community interest company — not-for-profit — dedicated to supporting neurodivergent individuals and their families.\n\nWe offer three core services:\n• 🛡️ Parent & Carer Advocacy\n• 🌟 Buddy & Mentorship (ages 14–35)\n• 🎨 Creative Skills Workshops\n\nFounded by Essie Rewane from lived experience as a parent. Would you like to know more about any of these?`;
  }
  if (m.includes('ehcp') || m.includes('education') || m.includes('school') || m.includes('sen') || m.includes('special needs') || m.includes('statement')) {
    return `We can help with that. Our Parent & Carer Support service includes:\n\n✅ Help with EHCP and special needs applications\n✅ Attending school meetings alongside you\n✅ Navigating multi-agency processes\n✅ Making sure your child's needs are properly represented\n\nYou don't have to face the system alone. 💜 Drop us a message via the contact form or email neurodivergencerevived@gmail.com — we'd love to talk.`;
  }
  if (m.includes('mentor') || m.includes('buddy') || m.includes('peer') || m.includes('companionship') || m.includes('social skills') || m.includes('friend')) {
    return `Our Buddy & Mentorship Programme pairs neurodivergent young adults (ages 14–35) with a carefully matched neurotypical peer mentor.\n\nIt's designed to build:\n• Confidence and independence\n• Social and communication skills\n• Career and education pathways\n\nSessions are flexible — in-person, online, or both. Email neurodivergencerevived@gmail.com or use the contact form to register. Referrals from schools and organisations are also welcome! 🌟`;
  }
  if (m.includes('workshop') || m.includes('art') || m.includes('music') || m.includes('ict') || m.includes('digital') || m.includes('design') || m.includes('graphic') || m.includes('creative') || m.includes('skills')) {
    return `Our Creative & Skills Development Workshops are tailored for the neurodivergent community — short, practical, and designed to go at your own pace.\n\nWe cover:\n🎨 Fine Art · 🎶 Music · 💻 ICT & Digital Skills · 🖌️ Graphic Design\n\nThese are pathways to confidence, employment, and self-expression. Get in touch via the contact form or email neurodivergencerevived@gmail.com and we'll share what's coming up!`;
  }
  if (m.includes('volunteer') || m.includes('volunteering') || m.includes('help out') || m.includes('give back') || m.includes('become a mentor') || m.includes('sign up')) {
    return `That's wonderful — thank you for wanting to get involved! 💚\n\nAs a volunteer mentor-buddy, you'd be paired with a neurodivergent young person for flexible, rewarding sessions. No experience needed — we provide full training.\n\nYou'll gain real skills in mentoring, communication, and leadership — and most importantly, you'll make a genuine difference in someone's life.\n\nHead to the Volunteer page on this site or email neurodivergencerevived@gmail.com to apply. We'd love to hear from you!`;
  }
  if (m.includes('parent') || m.includes('carer') || m.includes('family') || m.includes('my child') || m.includes('my son') || m.includes('my daughter') || m.includes('support')) {
    return `We're here for you. 💜 Our Parent & Carer Support service is built around the real challenges families face every day.\n\nWe can help with:\n• Navigating schools and the EHCP process\n• Accessing healthcare and social services\n• Attending meetings alongside you so you're not alone\n• Peer workshops and support networks for parents\n\nThe best first step is a conversation. Reach out via our contact form or email neurodivergencerevived@gmail.com — no pressure, just support.`;
  }
  if (m.includes('autism') || m.includes('autistic') || m.includes('adhd') || m.includes('dyslexia') || m.includes('neurodiverg') || m.includes('asd') || m.includes('spectrum')) {
    return `We support all forms of neurodivergence — autism, ADHD, dyslexia, and more. Our services are built around individual needs, not labels.\n\nWhether you're a parent navigating a diagnosis, a young adult looking for a mentor, or someone wanting to develop new skills — we have something for you.\n\nWhat's your specific situation? I'm happy to point you in the right direction. 😊`;
  }
  if (m.includes('age') || m.includes('how old') || m.includes('eligible') || m.includes('who can') || m.includes('qualify')) {
    return `Our services are designed for:\n\n• **Mentorship Programme**: Neurodivergent young adults aged 14–35\n• **Creative Workshops**: Open to the neurodivergent community broadly\n• **Parent & Carer Support**: For families of neurodivergent individuals of any age\n• **Volunteering**: Open to anyone aged 18+\n\nNot sure if you qualify? Just reach out — we'll always try to help, even if that means signposting elsewhere. 💜`;
  }
  if (m.includes('cost') || m.includes('price') || m.includes('free') || m.includes('fee') || m.includes('charge') || m.includes('afford') || m.includes('pay')) {
    return `As a Community Interest Company, our focus is on impact rather than profit. We aim to make our services as accessible as possible.\n\nFor specific information about costs or funding, please reach out directly:\n\n📧 neurodivergencerevived@gmail.com\n📋 Or use the contact form on this website`;
  }
  if (m.includes('contact') || m.includes('get in touch') || m.includes('reach') || m.includes('email') || m.includes('how do i')) {
    return `The easiest ways to reach us:\n\n📧 **Email**: neurodivergencerevived@gmail.com\n📋 **Contact form**: Available on the Contact page\n🌐 **Website**: neurodivergencerevived.org\n\nWe'll always get back to you as soon as we can. No question is too small. 💜`;
  }
  if (m.includes('refer') || m.includes('referral') || m.includes('professional') || m.includes('organisation') || m.includes('worker')) {
    return `We welcome referrals from schools, healthcare professionals, social workers, and partner organisations — especially for the Buddy & Mentorship Programme.\n\nEmail us at neurodivergencerevived@gmail.com with a brief overview and we'll take it from there. 🤝`;
  }
  if (m.includes('where') || m.includes('location') || m.includes('based') || m.includes('uk') || m.includes('england') || m.includes('in person') || m.includes('online')) {
    return `We're a UK-based organisation. Our sessions and support are available both in-person and online, depending on the programme and what works best for you.\n\nFor specific location details, email neurodivergencerevived@gmail.com and we'll help. 🇬🇧`;
  }
  if (m.includes('essie') || m.includes('founder') || m.includes('rewane')) {
    return `Neurodivergence Revived was founded by Essie Rewane, a parent of a son on the autism spectrum. Her personal journey — navigating schools, searching for mentors, and advocating for her child — inspired everything this organisation does.\n\nYou can read Essie's full story on the About page. 💜`;
  }
  if (m.includes('thank') || m.includes('thanks') || m.includes('cheers') || m.includes('appreciate')) {
    return `You're so welcome! 😊 That's what we're here for.\n\nIf there's anything else you'd like to know, don't hesitate to ask or use the contact form. We're always happy to help. 💜`;
  }

  // No match — return null to trigger Claude API
  return null;
}

// ---- Render markdown-style formatting ----
function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

// ---- Add a message bubble ----
function addMsg(text, sender) {
  const body = document.getElementById('chat-messages');
  const wrap = document.createElement('div');
  wrap.className = `msg ${sender === 'user' ? 'msg-user' : 'msg-bot'}`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (sender === 'bot') {
    wrap.innerHTML = `
      <div class="msg-bot-inner">
        <div class="msg-avatar">
          <img src="img/nova-avatar.jpg" alt="Nova"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="msg-avatar-fallback"><i data-lucide="bot" style="width:16px;height:16px;color:white;"></i></div>
        </div>
        <div>
          <div class="msg-bubble">${renderMarkdown(text)}</div>
          <div class="msg-time">Nova · ${time}</div>
        </div>
      </div>`;
    setTimeout(() => lucide.createIcons(), 50);
  } else {
    wrap.innerHTML = `
      <div class="msg-bubble">${renderMarkdown(text)}</div>
      <div class="msg-time">${time}</div>`;
  }

  body.appendChild(wrap);
  body.scrollTop = body.scrollHeight;
}

// ---- Typing indicator ----
function showTypingIndicator() {
  const body = document.getElementById('chat-messages');
  const wrap = document.createElement('div');
  wrap.className = 'msg msg-bot';
  wrap.id = 'typing-indicator';
  wrap.innerHTML = `
    <div class="msg-bot-inner">
      <div class="msg-avatar">
        <img src="img/nova-avatar.jpg" alt="Nova"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="msg-avatar-fallback"><i data-lucide="bot" style="width:16px;height:16px;color:white;"></i></div>
      </div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  body.appendChild(wrap);
  body.scrollTop = body.scrollHeight;
  setTimeout(() => lucide.createIcons(), 50);
}

function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

// ---- Clear chat ----
function clearChat() {
  conversationHistory = [];
  chatInitiated = false;
  const body = document.getElementById('chat-messages');
  if (body) body.innerHTML = '';
  const qr = document.getElementById('quick-replies');
  if (qr) qr.style.display = 'flex';
  setTimeout(() => {
    isTyping = true;
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      isTyping = false;
      addMsg(`Chat cleared! 🔄 Feel free to ask me anything about Neurodivergence Revived — I'm here to help. 💜`, 'bot');
    }, 700);
  }, 200);
}

// ---- Claude API fallback ----
async function callClaude(userMessage) {
  conversationHistory.push({ role: 'user', content: userMessage });
  if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 500,
      system:     NOVA_CONTEXT,
      messages:   conversationHistory,
    }),
  });

  const data  = await response.json();
  const reply = data.content?.[0]?.text
    || "I'm having a little trouble right now. Please email us at neurodivergencerevived@gmail.com and we'll get back to you. 💜";

  conversationHistory.push({ role: 'assistant', content: reply });
  return reply;
}

// ---- Main message handler ----
async function sendMessage() {
  if (isTyping) return;
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text) return;

  hideQuickReplies();
  input.value = '';
  addMsg(text, 'user');

  isTyping = true;
  const sendBtn = document.getElementById('chat-send-btn');
  if (sendBtn) sendBtn.disabled = true;

  const delay = 700 + Math.random() * 500;
  showTypingIndicator();
  await new Promise(resolve => setTimeout(resolve, delay));
  removeTypingIndicator();

  let reply = getLocalResponse(text);

  if (!reply) {
    try {
      reply = await callClaude(text);
    } catch (err) {
      console.error('Claude error:', err);
      reply = "I'm having a little trouble connecting right now. Please email us at neurodivergencerevived@gmail.com and we'll get back to you promptly! 💜";
    }
  } else {
    conversationHistory.push({ role: 'user', content: text });
    conversationHistory.push({ role: 'assistant', content: reply });
    if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);
  }

  addMsg(reply, 'bot');
  isTyping = false;
  if (sendBtn) sendBtn.disabled = false;
}

function sendQuick(text) {
  document.getElementById('chat-input').value = text;
  sendMessage();
}

function hideQuickReplies() {
  const qr = document.getElementById('quick-replies');
  if (qr) qr.style.display = 'none';
}

// ---- Auto-greet triggers ----
function autoGreet(reason) {
  if (chatInitiated || chatOpen) return;

  chatOpen = true;
  chatInitiated = true;
  const win = document.getElementById('chat-window');
  if (win) win.classList.add('open');

  const fabIcon = document.getElementById('chat-fab-icon');
  if (fabIcon) { fabIcon.setAttribute('data-lucide', 'x'); lucide.createIcons(); }

  const notif = document.getElementById('chat-notif');
  if (notif) notif.style.display = 'none';
  notifSeen = true;

  const messages = {
    time:   `Hi there! 👋 I'm Nova, the Neurodivergence Revived assistant.\n\nI noticed you've been exploring the site — is there something I can help you with? Whether it's finding the right support, joining our mentorship programme, or volunteering, I'm here. 💜`,
    scroll: `It looks like you found our contact page! 😊\n\nIf you'd like to chat before filling in the form, I'm here to help. What brings you to Neurodivergence Revived today?`,
  };

  setTimeout(() => {
    isTyping = true;
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      isTyping = false;
      addMsg(messages[reason] || messages.time, 'bot');
    }, 1000);
  }, 400);
}

// Auto-greet after 3 minutes
setTimeout(() => autoGreet('time'), 180000);

// Auto-greet when contact page is visible
window.addEventListener('scroll', () => {
  const contact = document.getElementById('page-contact');
  if (contact && contact.classList.contains('active')) {
    const rect = contact.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom >= 0) autoGreet('scroll');
  }
});

// ---- Toggle chat window ----
function toggleChat() {
  chatOpen = !chatOpen;
  const win     = document.getElementById('chat-window');
  const fabIcon = document.getElementById('chat-fab-icon');

  win.classList.toggle('open', chatOpen);
  if (fabIcon) {
    fabIcon.setAttribute('data-lucide', chatOpen ? 'x' : 'message-circle');
    lucide.createIcons();
  }

  if (chatOpen && !notifSeen) {
    const notif = document.getElementById('chat-notif');
    if (notif) notif.style.display = 'none';
    notifSeen = true;
  }

  if (chatOpen && conversationHistory.length === 0 && !chatInitiated) {
    chatInitiated = true;
    isTyping = true;
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      isTyping = false;
      addMsg(`Hi there! 👋 I'm Nova, the Neurodivergence Revived assistant.\n\nI'm here to help you find the right support, learn about our mentorship programme, creative workshops, or how to get involved as a volunteer.\n\nWhat can I help you with today? 💜`, 'bot');
    }, 900);
  }

  if (chatOpen) {
    setTimeout(() => {
      const input = document.getElementById('chat-input');
      if (input) input.focus();
    }, 350);
  }
}

// Show notification bubble after 4s
setTimeout(() => {
  if (!chatOpen && !notifSeen) {
    const notif = document.getElementById('chat-notif');
    if (notif) notif.style.display = 'block';
  }
}, 4000);