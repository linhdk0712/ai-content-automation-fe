// Script để test kết nối websocket đến 180.93.138.113:3001
// Chạy script này trong browser console để test kết nối

console.log('🔌 Testing WebSocket connection to 180.93.138.113:3001...');

// Test với Socket.IO client
if (typeof io !== 'undefined') {
    console.log('✅ Socket.IO client available');

    const socket = io('http://180.93.138.113:3001', {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true
    });

    socket.on('connect', () => {
        console.log('✅ Connected to websocket server!');
        console.log('Socket ID:', socket.id);

        // Test ping
        socket.emit('ping', { timestamp: Date.now() });
    });

    socket.on('pong', (data) => {
        console.log('🏓 Pong received:', data);
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason);
    });

    // Cleanup after 10 seconds
    setTimeout(() => {
        socket.disconnect();
        console.log('🧹 Test completed, socket disconnected');
    }, 10000);

} else {
    console.log('⚠️ Socket.IO client not available, testing with fetch...');

    // Test HTTP connection to websocket server
    fetch('http://180.93.138.113:3001/socket.io/?EIO=4&transport=polling')
        .then(response => {
            console.log('✅ HTTP connection successful:', response.status);
            return response.text();
        })
        .then(data => {
            console.log('📦 Response data:', data.substring(0, 100) + '...');
        })
        .catch(error => {
            console.error('❌ HTTP connection failed:', error);
        });
}

// Test environment variables
console.log('🔧 Environment check:');
console.log('VITE_REALTIME_SERVER_URL:', import.meta?.env?.VITE_REALTIME_SERVER_URL || 'Not available');
console.log('Current origin:', window.location.origin);