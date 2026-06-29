const formatDate = (date) =>
  new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date));

const formatDateOnly = (date) =>
  new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(date));

export { formatDate, formatDateOnly };
