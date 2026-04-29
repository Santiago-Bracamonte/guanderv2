import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { queryD1 } from '@/lib/cloudflare-d1';

type Subscription = {
  id_subscription: number;
  name: string;
  description: string;
  state: string;
  amount: number;
  plan_benefits: string;
};

type BenefitItem = { benefit: string; detail?: string };

function parseBenefits(raw: string): BenefitItem[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as BenefitItem[];
  } catch { /* fall through */ }
  return raw.split(/\n/).map((b) => ({ benefit: b.trim() })).filter((b) => b.benefit);
}

const planVisuals = [
  { color: '#166534', popular: false },
  { color: '#15803d', popular: true },
  { color: '#059669', popular: false },
  { color: '#047857', popular: false },
] as const;

function formatAmount(amount: number): string {
  return `$${amount.toLocaleString('es-AR')}`;
}

export default async function SubscriptionPlans() {
  let subscriptions: Subscription[] = [];

  try {
    subscriptions = await queryD1<Subscription>(
      "SELECT id_subscription, name, description, plan_benefits, state, amount FROM subscription WHERE state = 'activo' ORDER BY amount ASC"
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
                sx={{ position: 'relative' }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'visible',
                    mt: visual.popular ? 2 : 0,
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
                  {visual.popular && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%) translateY(-50%)',
                        bgcolor: '#15803d',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        px: 2,
                        py: 0.5,
                        borderRadius: '999px',
                        whiteSpace: 'nowrap',
                        zIndex: 1,
                        boxShadow: '0 2px 8px rgba(22,101,52,0.35)',
                      }}
                    >
                      ★ MÁS POPULAR
                    </Box>
                  )}

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

                  {/* Benefits list */}
                  {parseBenefits(plan.plan_benefits).length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      {parseBenefits(plan.plan_benefits).map((b, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                          <CheckCircleOutlineIcon sx={{ fontSize: 17, color: visual.color, mt: '2px', flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.5 }}>
                            <strong>{b.benefit}</strong>
                            {b.detail && (
                              <Typography component="span" variant="body2" color="text.secondary"> — {b.detail}</Typography>
                            )}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}


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

