// Calendar arithmetic uses UTC getters on China-local dates (UTC+8, no DST).
function h1DeliveryWindow(now, minDays, maxDays) {
  const dayMs = 86400000;
  const chinaOffset = 8 * 3600000;
  const chinaNow = new Date(now.getTime() + chinaOffset);
  const processing = new Date(Date.UTC(chinaNow.getUTCFullYear(), chinaNow.getUTCMonth(), chinaNow.getUTCDate()));
  const isWorkingDay = (date) => {
    const holiday = `${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
    return ![0, 6].includes(date.getUTCDay()) && !['12-24', '12-25', '1-1'].includes(holiday);
  };
  if (chinaNow.getUTCHours() >= 18) processing.setTime(processing.getTime() + dayMs);
  while (!isWorkingDay(processing)) processing.setTime(processing.getTime() + dayMs);
  const deadline = processing.getTime() + 18 * 3600000 - chinaOffset;
  const addWorkingDays = (count) => {
    const date = new Date(processing);
    while (count > 0) {
      date.setTime(date.getTime() + dayMs);
      if (isWorkingDay(date)) count -= 1;
    }
    return date;
  };
  return { deadline, first: addWorkingDays(minDays), last: addWorkingDays(maxDays) };
}

if (!customElements.get('h1-delivery-estimate')) {
  customElements.define('h1-delivery-estimate', class extends HTMLElement {
    connectedCallback() {
      this.update = () => {
        const message = this.querySelector('[data-delivery-message]');
        if (!message) return;
        const now = new Date();
        const window = h1DeliveryWindow(now, Number(this.dataset.minDays), Number(this.dataset.maxDays));
        const minutes = Math.ceil((window.deadline - now.getTime()) / 60000);
        const hours = Math.floor(minutes / 60);
        const remainder = minutes % 60;
        const countdown = hours ? `${hours}h ${remainder}m` : `${remainder}m`;
        const format = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', timeZone: 'UTC', ...(window.first.getUTCFullYear() !== window.last.getUTCFullYear() ? { year: 'numeric' } : {}) });
        const time = document.createElement('strong');
        time.textContent = countdown;
        const first = document.createElement('strong');
        first.textContent = format.format(window.first);
        const last = document.createElement('strong');
        last.textContent = format.format(window.last);
        message.replaceChildren('Order within ', time, ' for estimated delivery between ', first, ' and ', last);
        message.title = 'Order cutoff: 6 PM China time (UTC+8) on working days';
      };
      this.update();
      this.timer = setInterval(this.update, 1000);
    }
    disconnectedCallback() {
      clearInterval(this.timer);
    }
  });
}
