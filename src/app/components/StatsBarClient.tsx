"use client";

import { useEffect, useRef, useState } from "react";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

interface StatItem {
  value: number;
  suffix?: string;
  label: string;
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (value === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const steps = 60;
          const increment = value / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <Typography
      component="span"
      ref={ref}
      sx={{ fontSize: '2.5rem', fontWeight: 900, color: '#43D696', display: 'block', lineHeight: 1 }}
    >
      {count}{suffix}
    </Typography>
  );
}

export default function StatsBarClient({ stats }: { stats: StatItem[] }) {
  return (
    <Box component="section" sx={{ bgcolor: '#0f2f24', width: '100%' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4 }, py: 5 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)' },
          maxWidth: 480,
          mx: 'auto',
            gap: 3,
          }}
        >
          {stats.map((stat) => (
            <Box
              key={stat.label}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
            >
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  textAlign: 'center',
                  mt: 0.5,
                }}
              >
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
