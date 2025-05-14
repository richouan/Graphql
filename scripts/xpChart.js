function createXPChart(data) {
  let cumulativeXP = 0;
  const chartData = data.allXP.map(t => {
    cumulativeXP += t.amount;
    const date = new Date(t.createdAt);
    
    const timestamp = date.getTime();
    const projectMatch = data.projectDetails.find(p => 
      new Date(p.createdAt).getTime() === timestamp
    );
    
    return {
      date: date,
      amount: t.amount,
      total: cumulativeXP,
      projectName: projectMatch ? projectMatch.object.name : 'Module XP',
      isBonus: t.isBonus
    };
  });
  
  const container = document.querySelector('.graph-container');
  
  const header = container.querySelector('.project-header');
  const headerClone = header.cloneNode(true);
  
  const chartDiv = document.createElement('div');
  chartDiv.className = 'chart-area';
  
  container.innerHTML = '';
  
  container.appendChild(headerClone);
  container.appendChild(chartDiv);
  container.style.position = 'relative';
  
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.opacity = 0;
  tooltip.style.background = 'rgba(30, 30, 30, 0.9)';
  tooltip.style.padding = '10px';
  tooltip.style.borderRadius = '6px';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.transition = 'all 0.3s ease';
  tooltip.style.zIndex = 1000;
  tooltip.style.backdropFilter = 'blur(4px)';
  container.appendChild(tooltip);
  
  function createResponsiveChart() {
    const containerWidth = chartDiv.clientWidth || container.clientWidth - 40; // Subtract padding
    
    const margin = {top: 40, right: 20, bottom: 50, left: 60};
    const width = containerWidth - margin.left - margin.right;
    const height = Math.min(400, window.innerHeight * 0.4) - margin.top - margin.bottom;
    
    const minDate = chartData[0].date;
    const maxDate = chartData[chartData.length - 1].date;
    const maxXP = chartData[chartData.length - 1].total;
    
    const svgContent = `
      <svg width="100%" height="100%" viewBox="0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0056b3" />
            <stop offset="100%" stop-color="#00ffff" />
          </linearGradient>
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <g transform="translate(${margin.left}, ${margin.top})">
          <!-- Grid Lines -->
          ${generateGridLines(width, height, 5, 5)}
          
          <!-- X and Y axes -->
          ${generateAxes(width, height, minDate, maxDate, maxXP)}
          
          <!-- Area under the line -->
          <path d="${generateAreaPath(chartData, width, height, minDate, maxDate, maxXP)}" 
                fill="url(#line-gradient)" 
                opacity="0.1" />
          
          <!-- Line chart -->
          <path d="${generateLinePath(chartData, width, height, minDate, maxDate, maxXP)}"
                stroke="url(#line-gradient)"
                stroke-width="3"
                fill="none"
                filter="url(#glow)"
                class="animated-line" />
          
          <!-- Data points -->
          ${generateDataPoints(chartData, width, height, minDate, maxDate, maxXP)}
        </g>
      </svg>
    `;
    
    chartDiv.innerHTML = svgContent;
    
    const line = chartDiv.querySelector('.animated-line');
    if (line) {
      const length = line.getTotalLength();
      line.style.strokeDasharray = length;
      line.style.strokeDashoffset = length;
      line.style.animation = 'drawLine 1.5s forwards';
    }
    
    const points = chartDiv.querySelectorAll('.data-point');
    points.forEach((point, i) => {
      const data = chartData[i];
      
      point.addEventListener('mouseover', function(event) {
        this.setAttribute('r', 8);
        this.setAttribute('stroke-width', 3);
        
        tooltip.style.opacity = 1;
        tooltip.innerHTML = `
          <div style="padding: 8px">
            <div style="font-weight: bold; color: #00ffff">${data.projectName}</div>
            <div style="margin: 5px 0">
              <span style="color: #888">XP Gained:</span> 
              <span style="color: #fff">${formatXP(data.amount)}</span>
            </div>
            <div style="margin: 5px 0">
              <span style="color: #888">Total XP:</span> 
              <span style="color: #fff">${formatXP(data.total)}</span>
            </div>
            <div style="color: #888; font-size: 0.9em">
              ${data.date.toLocaleDateString()}
            </div>
          </div>
        `;
        
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        
        const containerRect = container.getBoundingClientRect();
        const cursorXRelative = event.clientX - containerRect.left;
        const cursorYRelative = event.clientY - containerRect.top;
        
        let xPos = cursorXRelative + 15;
        if (xPos + tooltipWidth > containerRect.width) {
          xPos = cursorXRelative - tooltipWidth - 15;
        }
        
        let yPos = cursorYRelative - (tooltipHeight / 2);
        if (yPos < 0) {
          yPos = 10;
        } else if (yPos + tooltipHeight > containerRect.height) {
          yPos = containerRect.height - tooltipHeight - 10; 
        }
        
        tooltip.style.left = `${xPos}px`;
        tooltip.style.top = `${yPos}px`;
        tooltip.style.transform = 'none'; 
      });
      
      point.addEventListener('mouseout', function() {
        this.setAttribute('r', 6);
        this.setAttribute('stroke-width', 2);
        
        tooltip.style.opacity = 0;
      });
    });
  }
  
  createResponsiveChart();
  
  const resizeObserver = new ResizeObserver(() => {
    createResponsiveChart();
  });
  
  resizeObserver.observe(container);
  
  if (!document.getElementById('chart-animations')) {
    const style = document.createElement('style');
    style.id = 'chart-animations';
    style.textContent = `
      @keyframes drawLine {
        to {
          stroke-dashoffset: 0;
        }
      }
      .data-point {
        transition: r 0.2s, stroke-width 0.2s;
      }
      .chart-area {
        width: 100%;
        height: 100%;
        min-height: 300px;
      }
    `;
    document.head.appendChild(style);
  }
  
  function generateGridLines(width, height, xCount, yCount) {
    let lines = '';
    
    for (let i = 0; i <= xCount; i++) {
      const x = (width / xCount) * i;
      lines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#333" stroke-opacity="0.1" />`;
    }
    
    for (let i = 0; i <= yCount; i++) {
      const y = (height / yCount) * i;
      lines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#333" stroke-opacity="0.1" />`;
    }
    
    return lines;
  }
  
  function generateAxes(width, height, minDate, maxDate, maxXP) {
    const xAxis = `<line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="#444" />`;
    
    const tickCount = width < 500 ? 3 : 5;
    let xTicks = '';
    
    for (let i = 0; i <= tickCount; i++) {
      const x = (width / tickCount) * i;
      const tickDate = new Date(minDate.getTime() + (maxDate.getTime() - minDate.getTime()) * (i / tickCount));
      const month = tickDate.toLocaleString('default', { month: 'short' });
      const year = tickDate.getFullYear();
      
      xTicks += `
        <line x1="${x}" y1="${height}" x2="${x}" y2="${height + 5}" stroke="#444" />
        <text x="${x}" y="${height + 20}" text-anchor="middle" font-size="12px" fill="#888">
          ${month} ${year}
        </text>
      `;
    }
    
    const yAxis = `<line x1="0" y1="0" x2="0" y2="${height}" stroke="#444" />`;
    
    const yTickCount = height < 300 ? 4 : 8;
    let yTicks = '';
    
    for (let i = 0; i <= yTickCount; i++) {
      const y = height - (height / yTickCount) * i;
      const tickValue = (maxXP / yTickCount) * i;
      
      yTicks += `
        <line x1="-5" y1="${y}" x2="0" y2="${y}" stroke="#444" />
        <text x="-10" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="12px" fill="#888">
          ${formatXP(tickValue)}
        </text>
      `;
    }
    
    return xAxis + xTicks + yAxis + yTicks;
  }
  
  function generateLinePath(data, width, height, minDate, maxDate, maxXP) {
    if (data.length === 0) return '';
    
    let path = `M ${mapX(data[0].date, width, minDate, maxDate)} ${mapY(data[0].total, height, maxXP)}`;
    
    for (let i = 1; i < data.length; i++) {
      const point = data[i];
      path += ` L ${mapX(point.date, width, minDate, maxDate)} ${mapY(point.total, height, maxXP)}`;
    }
    
    return path;
  }
  
  function generateAreaPath(data, width, height, minDate, maxDate, maxXP) {
    if (data.length === 0) return '';
    
    let path = `M ${mapX(data[0].date, width, minDate, maxDate)} ${height}`;
    
    path += ` L ${mapX(data[0].date, width, minDate, maxDate)} ${mapY(data[0].total, height, maxXP)}`;
    
    for (let i = 1; i < data.length; i++) {
      const point = data[i];
      path += ` L ${mapX(point.date, width, minDate, maxDate)} ${mapY(point.total, height, maxXP)}`;
    }
    
    path += ` L ${mapX(data[data.length-1].date, width, minDate, maxDate)} ${height} Z`;
    
    return path;
  }
  
  function generateDataPoints(data, width, height, minDate, maxDate, maxXP) {
    const pointsToShow = width < 500 ? 
      data.filter((_, i) => i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 10) === 0) : 
      data;
      
    return pointsToShow.map((point, i) => {
      const x = mapX(point.date, width, minDate, maxDate);
      const y = mapY(point.total, height, maxXP);
      const color = point.isBonus ? '#00ffff' : '#007BFF';
      
      return `
        <circle 
          class="data-point" 
          cx="${x}" 
          cy="${y}" 
          r="6" 
          fill="${color}"
          stroke="#1e1e1e"
          stroke-width="2"
          data-index="${i}" 
        />
      `;
    }).join('');
  }
  
  function mapX(date, width, minDate, maxDate) {
    const timeRange = maxDate.getTime() - minDate.getTime();
    return ((date.getTime() - minDate.getTime()) / timeRange) * width;
  }
  
  function mapY(value, height, maxValue) {
    return height - (value / maxValue) * height;
  }
}