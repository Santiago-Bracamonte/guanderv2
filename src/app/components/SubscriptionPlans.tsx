import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ShieldIcon from '@mui/icons-material/Shield';
import StarIcon from '@mui/icons-material/Star';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BoltIcon from '@mui/icons-material/Bolt';
import { queryD1 } from '@/lib/cloudflare-d1';

type Subscription = {
  id_subscription: number;
  name: string;
  description: string;
  state: string;
  amount: number;
};

const planVisuals = [
  { icon: <ShieldIcon />, color: '#166534', popular: false },
  { icon: <StarIcon />, color: '#15803d', popular: true },
  { icon: <RocketLaunchIcon />, color: '#059669', popular: false },
  { icon: <BoltIcon />, color: '#047857', popular: false },
] as const;

function formatAmount(amount: number): string {
  return `$${amount.toLocaleString('es-AR')}`;
}

export default async function SubscriptionPlans() {
  let subscriptions: Subscription[] = [];

  try {
    subscriptions = await queryD1<Subscription>(
      "SELECT id_subscription, name, description, state, amount FROM subscription WHERE state = 'activo' ORDER BY amount ASC"
    );
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
  }

  return (
    <Box
      id="planes"
      component="section"
      sx={{ bgcolor: 'background.paper', py: { xs: 8, md: 12 }, width: '100%' }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4 }, overflow: 'visible' }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.875rem', sm: '2.5rem' }, mb: 1.5 }}>
            Planes de Suscripción
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: '1.0625rem' }}>
            ¡Elegí el plan que mejor se adapte a vos!
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: `repeat(${Math.min(subscriptions.length || 3, 4)}, 1fr)`,
            },
            gap: 3,
            alignItems: 'start',
            overflow: 'visible',
          }}
        >
          {subscriptions.map((plan, index) => {
            const visual = planVisuals[index] ?? planVisuals[planVisuals.length - 1];
            return (
              <Box
                key={plan.id_subscription}
                sx={{ position: 'relative', pt: visual.popular ? '14px' : 0 }}
              >
                {visual.popular && (
                  <Chip
                    icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
                    label="MÁS POPULAR"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: '#166534',
                      color: 'white',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      px: 1,
                      zIndex: 1,
                    }}
                  />
                )}
                <Card
                  variant="outlined"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: '2px solid',
                    borderColor: visual.popular ? '#15803d' : 'rgba(22,101,52,0.16)',
                    boxShadow: visual.popular
                      ? '0 8px 40px rgba(22,101,52,0.24)'
                      : '0 2px 16px rgba(22,101,52,0.1)',
                    transition: 'box-shadow 0.25s, transform 0.25s',
                    '&:hover': {
                      boxShadow: '0 12px 48px rgba(22,101,52,0.22)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >

                <CardContent sx={{ p: 3.5, '&:last-child': { pb: 3.5 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}
                    >
                      {plan.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
                      <Typography
                        sx={{ fontSize: { xs: '2.25rem', lg: '2.75rem' }, fontWeight: 900, color: visual.color, lineHeight: 1 }}
                      >
                        {formatAmount(plan.amount)}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontWeight: 500 }}>/mes</Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2, fontStyle: 'italic', minHeight: 40, lineHeight: 1.6 }}
                    >
                      {plan.description}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'rgba(22,101,52,0.12)' }}>
                    <Button
                      variant={visual.popular ? 'contained' : 'outlined'}
                      fullWidth
                      size="large"
                      startIcon={visual.icon}
                      sx={{
                        ...(visual.popular
                          ? {}
                          : { borderColor: visual.color, color: visual.color, '&:hover': { borderColor: visual.color, bgcolor: `${visual.color}0a` } }),
                        bgcolor: visual.popular ? visual.color : undefined,
                        '&:hover': visual.popular ? { bgcolor: visual.color, opacity: 0.9 } : undefined,
                      }}
                    >
                      Elegir {plan.name}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
            );
          })}
        </Box>

        <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'rgba(22,101,52,0.16)',
              borderRadius: '50px',
              px: 3,
              py: 1.5,
              boxShadow: '0 2px 12px rgba(22,101,52,0.1)',
            }}
          >
            <InfoOutlinedIcon sx={{ color: 'warning.main', fontSize: 18 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Todos los planes incluyen 30 días de prueba gratis. Cancelá cuando quieras sin penalidades.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

