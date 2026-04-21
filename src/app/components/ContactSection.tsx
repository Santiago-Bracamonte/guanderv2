'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export default function ContactSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Por favor completá nombre, email y mensaje.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al enviar el mensaje.');
        return;
      }
      setSuccess(true);
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch {
      setError('Error de red. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      backgroundColor: 'rgba(255,255,255,0.07)',
      color: 'white',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
      '&:hover fieldset': { borderColor: 'rgba(185,231,208,0.5)' },
      '&.Mui-focused fieldset': { borderColor: '#b9e7d0' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#b9e7d0' },
    '& .MuiInputBase-input': { color: 'white' },
    '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.35)' },
  };

  return (
    <Box
      id="contacto"
      component="section"
      sx={{ bgcolor: '#1a1b3c', py: { xs: 8, md: 12 }, width: '100%' }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 6, md: 10 },
            alignItems: 'center',
          }}
        >
          {/* Left — info */}
          <Box>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '14px',
                backgroundColor: 'rgba(185,231,208,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <EmailOutlinedIcon sx={{ color: '#b9e7d0', fontSize: 28 }} />
            </Box>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.875rem', sm: '2.5rem' },
                fontWeight: 800,
                color: 'white',
                mb: 2,
                lineHeight: 1.15,
              }}
            >
              ¿Tenés alguna{' '}
              <Box component="span" sx={{ color: '#b9e7d0' }}>
                pregunta?
              </Box>
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '1.0625rem',
                lineHeight: 1.8,
                mb: 4,
              }}
            >
              Completá el formulario y te respondemos a la brevedad. Ya sea que quieras registrar tu local, sumarte como profesional o simplemente saber más sobre Guander.
            </Typography>

            <Stack spacing={2.5}>
              {[
                { label: 'Email', value: 'tomas.gonzalezz@davinci.edu.ar' },
                { label: 'Atención', value: 'Lunes a viernes de 9 a 18h' },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#b9e7d0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {label}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9375rem' }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Right — form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              p: { xs: 3, sm: 4 },
            }}
          >
            {success ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 56, color: '#b9e7d0', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                  ¡Mensaje enviado!
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem', mb: 3 }}>
                  Gracias por contactarnos. Te respondemos pronto.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setSuccess(false)}
                  sx={{
                    borderColor: '#b9e7d0',
                    color: '#b9e7d0',
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { borderColor: '#a8ddc3', backgroundColor: 'rgba(185,231,208,0.12)' },
                  }}
                >
                  Enviar otro mensaje
                </Button>
              </Box>
            ) : (
              <Stack spacing={2.5}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                  <TextField
                    label="Nombre *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    size="small"
                    sx={fieldSx}
                    inputProps={{ maxLength: 80 }}
                  />
                  <TextField
                    label="Email *"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="small"
                    sx={fieldSx}
                    inputProps={{ maxLength: 120 }}
                  />
                </Box>
                <TextField
                  label="Asunto"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  size="small"
                  sx={fieldSx}
                  inputProps={{ maxLength: 120 }}
                />
                <TextField
                  label="Mensaje *"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  multiline
                  rows={5}
                  sx={fieldSx}
                  inputProps={{ maxLength: 2000 }}
                />

                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: 'rgba(239,68,68,0.12)',
                      color: '#fca5a5',
                      '& .MuiAlert-icon': { color: '#f87171' },
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                  sx={{
                    borderRadius: '12px',
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    textTransform: 'none',
                    backgroundColor: '#9fd5b9',
                    color: '#1a1b3c',
                    '&:hover': { backgroundColor: '#90c9ac' },
                    '&:disabled': { backgroundColor: 'rgba(159,213,185,0.45)', color: '#1a1b3c' },
                  }}
                >
                  {loading ? 'Enviando...' : 'Enviar mensaje'}
                </Button>
              </Stack>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
