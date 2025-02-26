const API_URL = "https://script.google.com/macros/s/AKfycbyJLqrtYiCQ-POYDBZbl5-XYIp4O8um-g_2lt-q2XMNPOk_NLkgWVbnyn14wkrqwwND7A/exec";


// 🛠️ Hàm tạo ID thiết bị (Lưu ID vào localStorage để nhận diện thiết bị)
function getDeviceId() {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
        deviceId = "device-" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
}

// 🛠️ Hàm lấy ngày hiện tại (YYYY-MM-DD)
function getToday() {
    return new Date().toISOString().split("T")[0];
}

// 🛠️ Hàm lấy thời gian reset vào 5h sáng hôm nay/mai
function getResetTime() {
    let now = new Date();
    let resetTime = new Date();

    // Nếu hiện tại đã qua 5h sáng, thì đặt reset vào 5h sáng ngày mai
    if (now.getHours() >= 5) {
        resetTime.setDate(now.getDate() + 1);
    }

    // Đặt resetTime thành 5h sáng
    resetTime.setHours(5, 0, 0, 0);

    return resetTime.getTime(); // Trả về timestamp (milliseconds)
}

// 🛠️ Hàm kiểm tra xem đã đến thời điểm reset chưa
function shouldResetQuote(deviceId) {
    const lastReset = localStorage.getItem(`${deviceId}-lastReset`) || 0;
    const nextReset = getResetTime();
    return Date.now() >= nextReset; // Nếu thời gian hiện tại >= 5h sáng, cần reset
}

// 🛠️ Hàm lấy quote đã lưu cho thiết bị trong ngày (nếu có)
function getStoredQuote(deviceId) {
    return localStorage.getItem(`${deviceId}-quote`) || null;
}

// 🛠️ Hàm lấy danh sách quote từ Google Sheets
async function fetchQuotes() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        return data.quotes; 
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        return [];
    }
}

// 🛠️ Hàm chọn quote ngẫu nhiên (không trùng lặp với những quote đã nhận)
function getRandomQuote(deviceId, quotes) {
    let usedQuotes = JSON.parse(localStorage.getItem(`${deviceId}-usedQuotes`)) || [];

    // Lọc ra danh sách quote chưa từng được sử dụng
    let availableQuotes = quotes.filter(q => !usedQuotes.includes(q));

    // Nếu hết quote, reset lại danh sách
    if (availableQuotes.length === 0) {
        usedQuotes = [];
        availableQuotes = quotes;
    }

    // Chọn ngẫu nhiên 1 câu từ danh sách chưa dùng
    let selectedQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];

    // Cập nhật danh sách quote đã dùng
    usedQuotes.push(selectedQuote);
    localStorage.setItem(`${deviceId}-usedQuotes`, JSON.stringify(usedQuotes));

    // Lưu quote mới
    localStorage.setItem(`${deviceId}-quote`, selectedQuote);
    localStorage.setItem(`${deviceId}-lastReset`, Date.now()); // Cập nhật thời gian reset mới

    return selectedQuote;
}

// 🛠️ Hàm hiển thị quote và thông báo reset
async function getQuote() {
    const quotes = await fetchQuotes();
    if (quotes.length === 0) {
        document.getElementById("quote").textContent = "Không thể tải quote.";
        return;
    }

    const deviceId = getDeviceId();
    let storedQuote = getStoredQuote(deviceId);

    // Kiểm tra nếu đã qua 5h sáng -> Cập nhật quote mới
    if (!storedQuote || shouldResetQuote(deviceId)) {
        storedQuote = getRandomQuote(deviceId, quotes);
    }

    document.getElementById("quote").textContent = storedQuote;
    document.getElementById("reset-time").textContent = `Bạn sẽ nhận quote mới vào lúc 5h sáng (${new Date(getResetTime()).toLocaleString("vi-VN")})`;
}

document.addEventListener("DOMContentLoaded", getQuote);
