document.addEventListener('DOMContentLoaded', function() {
    const shapes = document.querySelectorAll('.shape');

    function detectCollision(shape1, shape2) {
        const rect1 = shape1.getBoundingClientRect();
        const rect2 = shape2.getBoundingClientRect();
        return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
    }

    function handleCollision(shape1, shape2) {
        console.log('Collision detected between:', shape1, 'and', shape2);
        setTimeout(() => {
            shape1.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            shape2.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        }, 500);
    }

    function checkCollisions() {
        for (let i = 0; i < shapes.length; i++) {
            for (let j = i + 1; j < shapes.length; j++) {
                if (detectCollision(shapes[i], shapes[j])) {
                    handleCollision(shapes[i], shapes[j]);
                }
            }
        }
    }

    setInterval(checkCollisions, 100);
});