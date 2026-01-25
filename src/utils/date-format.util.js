
const formatAppDate = (dateValue) => {
    if (!dateValue) return 'To be confirmed';

    try {
        const date = new Date(dateValue);

        
        if (isNaN(date.getTime())) return 'To be confirmed';

        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC' 
        }).format(date);
    } catch (error) {
        return 'To be confirmed';
    }
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

module.exports = {
    formatAppDate,
    formatCurrency
};