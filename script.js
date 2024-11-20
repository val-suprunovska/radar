const LIGHT_SPEED = 300000; // km/s
const MAX_RADIUS = 141; // Maximum distance in km
const scanResults = {};
const baseColor = 'rgba(40, 90, 160, '; // Base color for points, transparency added dynamically

// Initialize chart
Plotly.newPlot('radarChart', [{
    type: 'scatterpolar',
    mode: 'markers',
    r: [],
    theta: [],
    marker: {
        color: [],
        size: 8,
        line: {
            color: 'black',
            width: 1
        }
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

// Function to calculate opacity based on distance
function calculateOpacity(distance) {
    const minOpacity = 0.1;  // Minimum opacity
    const maxOpacity = 1;    // Maximum opacity (closer to center)
    return Math.max(minOpacity, maxOpacity - (distance / MAX_RADIUS) * maxOpacity);
}

function updateChart(scanData) {
    scanResults[scanData.scanAngle] = scanData.echoResponses.map(response => ({
        distance: (response.time * LIGHT_SPEED) / 2,
        power: response.power
    }));

    const radii = [];
    const angles = [];
    const colors = [];

    for (const [angle, responses] of Object.entries(scanResults)) {
        responses.forEach(response => {
            if (response.distance > 0 && response.distance <= MAX_RADIUS) {
                radii.push(response.distance);
                angles.push(angle);
                const opacity = calculateOpacity(response.distance);
                colors.push(`${baseColor}${opacity})`); // Adjust opacity
            }
        });
    }

    Plotly.update('radarChart', {
        r: [radii],
        theta: [angles],
        marker: {
            color: colors,
            line: { color: 'black', width: 1 }
        }
    });
}

// Function to update radar configuration
async function updateRadarConfig() {
    const measurementsPerRotation = document.getElementById('measurementsPerRotation').value || 360;
    const rotationSpeed = document.getElementById('rotationSpeed').value || 60;
    const targetSpeed = document.getElementById('targetSpeed').value || 100;

    const configData = {
        measurementsPerRotation: parseInt(measurementsPerRotation),
        rotationSpeed: parseInt(rotationSpeed),
        targetSpeed: parseInt(targetSpeed)
    };

    try {
        const response = await fetch('http://localhost:4000/config', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(configData)
        });

        if (response.ok) {
            alert("Radar configuration updated successfully!");
        } else {
            alert("Failed to update configuration. Check the server.");
        }
    } catch (error) {
        console.error("Error updating radar config:", error);
    }
}

const socket = new WebSocket('ws://localhost:4000');

socket.onopen = () => {
    console.log('Connected to WebSocket server');
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateChart(data);
};

socket.onclose = () => {
    console.log('Connection closed');
};

socket.onerror = (error) => {
    console.error('WebSocket error:', error);
};