const LIGHT_SPEED = 300000;
        const MAX_RADIUS = 141;
        const scanResults = {};

        //Ініціалізація графіка
        Plotly.newPlot('radarChart', [{
            type: 'scatterpolar',
            mode: 'markers',
            r: [],
            theta: [],
            marker: {
                colors: [],
                size: 8
            }
        }], {
            polar: {
                radialaxis: {
                    range: [0, MAX_RADIUS],
                    angle: 90,
                    showline: true
                },
                angularaxis: {
                    direction: "clockwise"
                }
            },
            showlegend: false
        });

    
        // Функція для розрахунку яскравості залежно від потужності
        function calculateBrightness(power, distance) {
            return 1;
        }
    
        // Функція оновлення графіка
        function updateChart(scanData) {
            // Оновлення даних у об'єкті-карті
            scanResults[scanData.scanAngle] = scanData.echoResponses.map(response => {
                return {
                    distance: (response.time * LIGHT_SPEED) / 2, // Розрахунок відстані з часу
                    power: response.power
                };
            });

            // Оновлення даних для графіка
            const radii = [];
            const angles = [];
            const colors = [];

            for (const [angle, responses] of Object.entries(scanResults)) {
                responses.forEach(response => {
                    if (response.distance > 0) {
                        radii.push(response.distance);
                        angles.push(angle);
                        const brightness = calculateBrightness(response.power, response.distance);
                        colors.push('rgb(54, 162, 235, ${brightness})');
                    }
                });
            }

            // Оновлення графіка з новими даними
            Plotly.update('radarChart', {
                r: [radii],
                theta: [angles],
                marker: {color: colors}
            });
        }
        
        // Ініціалізація WebSocket-з'єднання
        const socket = new WebSocket('ws://localhost:4000');

        socket.onopen = () => {
            console.log('Підключено до WebSocket сервера');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updateChart(data);
        };

        socket.onclose = () => {
            console.log('З\'єднання закрито');
        };

        socket.onerror = (error) => {
            console.error('Помилка WebSocket:', error);
        };