import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Paper, Typography, CircularProgress, Alert, AlertTitle, Divider, 
  Tabs, Tab, Button, Chip, LinearProgress, IconButton, FormControl, InputLabel,
  Select, MenuItem, Tooltip as MuiTooltip
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, 
  ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import useTrading from '../hooks/useTrading';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [localBitcoinData, setLocalBitcoinData] = useState([]);
  const { 
    bitcoinData, 
    currentPrice, 
    priceChange24h, 
    indicators, 
    sentiment,
    riskManagement,
    tradingSignal,
    prediction,
    signalHistory,
    isLoading, 
    error, 
    resetError,
    refreshData
  } = useTrading();

  // Synchroniser les données locales avec les données du hook
  useEffect(() => {
    if (bitcoinData && bitcoinData.length > 0) {
      setLocalBitcoinData(bitcoinData);
    }
  }, [bitcoinData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Fonction pour afficher le niveau de confiance avec une couleur
  const renderConfidenceLevel = (confidence) => {
    const confidencePercent = confidence * 100;
    let color = 'warning.main';
    if (confidencePercent >= 75) color = 'success.main';
    else if (confidencePercent < 40) color = 'error.main';

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          Confiance:
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={confidencePercent} 
          color={confidencePercent >= 75 ? 'success' : confidencePercent < 40 ? 'error' : 'warning'}
          sx={{ width: '50%', mr: 1 }}
        />
        <Typography variant="body2" color={color}>
          {confidencePercent.toFixed(1)}%
        </Typography>
      </Box>
    );
  };

  return (
    <Box p={{ xs: 1, sm: 2, md: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" color="primary" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
          Bitcoin Trading Bot
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MuiTooltip title="Changer la source des données">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="api-source-label">Source API</InputLabel>
              <Select
                labelId="api-source-label"
                value={localStorage.getItem('preferredAPI') || 'binance'}
                label="Source API"
                onChange={(e) => {
                  localStorage.setItem('preferredAPI', e.target.value);
                  refreshData();
                }}
                disabled={isLoading}
              >
                <MenuItem value="binance">Binance</MenuItem>
                <MenuItem value="coingecko">CoinGecko</MenuItem>
              </Select>
            </FormControl>
          </MuiTooltip>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={refreshData}
            disabled={isLoading}
          >
            Actualiser
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Prix actuel et Signal */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">Prix Bitcoin (USD)</Typography>
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                    ${currentPrice.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography 
                      variant="body1" 
                      color={priceChange24h >= 0 ? 'success.main' : 'error.main'}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}% (24h)
                    </Typography>
                    {isLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">Signal de Trading</Typography>
                  <Chip 
                    label={tradingSignal.signal}
                    color={
                      tradingSignal.signal === 'ACHETER' ? 'success' : 
                      tradingSignal.signal === 'VENDRE' ? 'error' : 
                      'default'
                    }
                    sx={{ 
                      fontSize: '1.5rem', 
                      py: 3,
                      fontWeight: 'bold'
                    }}
                  />
                  {renderConfidenceLevel(tradingSignal.confidence)}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Sentiment et Gestion du Risque */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" align="center" gutterBottom>
              Sentiment du Marché
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ mt: 2 }}>
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <CircularProgress size={20} />
                </Box>
              )}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Indice Peur & Avidité</Typography>
                  <Typography 
                    variant="body1" 
                    color={
                      sentiment.fearGreedIndex > 70 ? 'error.main' :
                      sentiment.fearGreedIndex < 30 ? 'success.main' :
                      'warning.main'
                    }
                  >
                    {sentiment.fearGreedIndex}/100
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Sentiment Social</Typography>
                  <Typography 
                    variant="body1" 
                    color={
                      sentiment.socialSentiment === 'positif' ? 'success.main' :
                      sentiment.socialSentiment === 'négatif' ? 'error.main' :
                      'text.secondary'
                    }
                  >
                    {sentiment.socialSentiment}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Gestion du Risque</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="error.main">
                        Stop Loss: ${riskManagement.stopLoss ? riskManagement.stopLoss.toFixed(0) : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="success.main">
                        Take Profit: ${riskManagement.takeProfit ? riskManagement.takeProfit.toFixed(0) : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Tabs pour les différentes sections */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ mb: 2 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Graphique" />
              <Tab label="Indicateurs Techniques" />
              <Tab label="Analyse" />
              <Tab label="Prédictions" />
              <Tab label="Historique des Signaux" />
            </Tabs>
          </Paper>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={resetError}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Contenu des tabs */}
        <Grid item xs={12} sx={{ maxWidth: '100vw' }}>
          {/* Graphique */}
          {activeTab === 0 && (
          <Paper elevation={3} sx={{ 
            p: { xs: 1, sm: 2 }, 
            height: { xs: '500px', sm: '700px', md: '800px' },
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden'
          }}>
            {/* Boutons pour générer des données de test */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={refreshData}
              >
                Actualiser les données
              </Button>
            </Box>
            {/* Espace pour le graphique */}
            
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={localBitcoinData.map(item => ({
                ...item,
                // Assurer que price est un nombre
                price: typeof item.price === 'number' ? item.price : parseFloat(item.price)
              }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                <XAxis 
                  dataKey="time" 
                  fontSize={{ xs: 8, sm: 10, md: 12 }}
                  tickFormatter={(time) => time.split(' ')[0]}
                  tick={{ fill: '#fff' }}
                  tickCount={{ xs: 3, sm: 5, md: 8 }}
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  fontSize={{ xs: 8, sm: 10, md: 12 }}
                  tickFormatter={(value) => value.toLocaleString()}
                  tick={{ fill: '#fff' }}
                  width={50}
                />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1e1e1e' }}
                  formatter={(value) => ['$' + value.toLocaleString(), 'Prix']}
                />
                
                {/* Vérification des données */}
                {localBitcoinData.length === 0 ? (
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#fff">
                    Chargement des données...
                  </text>
                ) : null}
                <Legend />
                
                {/* Prix - Vérification que localBitcoinData contient des éléments */}
                {localBitcoinData.length > 0 && (
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#2196f3" 
                    dot={false}
                    name="Prix BTC"
                    strokeWidth={2}
                  />
                )}

                {/* Bandes de Bollinger - Vérification que bitcoinData contient des éléments */}
                {indicators.bollinger && bitcoinData.length > 0 && (
                  <>
                    <Line
                      type="monotone"
                      data={localBitcoinData.map(d => ({ ...d, upper: indicators.bollinger.upper }))}
                      dataKey="upper"
                      stroke="#4caf50"
                      dot={false}
                      strokeDasharray="3 3"
                      name="Bollinger Haut"
                    />
                    <Line
                      type="monotone"
                      data={localBitcoinData.map(d => ({ ...d, lower: indicators.bollinger.lower }))}
                      dataKey="lower"
                      stroke="#f44336"
                      dot={false}
                      strokeDasharray="3 3"
                      name="Bollinger Bas"
                    />
                  </>
                )}

                {/* Niveaux de Fibonacci */}
                {indicators.fibonacci && (
                  <>
                    <ReferenceLine 
                      y={indicators.fibonacci.level0}
                      stroke="#9c27b0"
                      strokeDasharray="3 3"
                      label={{ value: '0%', position: 'right', fill: '#9c27b0' }}
                    />
                    <ReferenceLine 
                      y={indicators.fibonacci.level236}
                      stroke="#9c27b0"
                      strokeDasharray="3 3"
                      label={{ value: '23.6%', position: 'right', fill: '#9c27b0' }}
                    />
                    <ReferenceLine 
                      y={indicators.fibonacci.level382}
                      stroke="#9c27b0"
                      strokeDasharray="3 3"
                      label={{ value: '38.2%', position: 'right', fill: '#9c27b0' }}
                    />
                    <ReferenceLine 
                      y={indicators.fibonacci.level618}
                      stroke="#9c27b0"
                      strokeDasharray="3 3"
                      label={{ value: '61.8%', position: 'right', fill: '#9c27b0' }}
                    />
                    <ReferenceLine 
                      y={indicators.fibonacci.level100}
                      stroke="#9c27b0"
                      strokeDasharray="3 3"
                      label={{ value: '100%', position: 'right', fill: '#9c27b0' }}
                    />
                  </>
                )}

                {/* Niveaux de support et résistance */}
                {indicators.supports?.map((support, i) => (
                  <ReferenceLine 
                    key={`support-${i}`}
                    y={support}
                    stroke="#4caf50"
                    strokeDasharray="3 3"
                    opacity={0.5}
                    label={{ value: 'S', position: 'right', fill: '#4caf50' }}
                  />
                ))}
                {indicators.resistances?.map((resistance, i) => (
                  <ReferenceLine 
                    key={`resistance-${i}`}
                    y={resistance}
                    stroke="#f44336"
                    strokeDasharray="3 3"
                    opacity={0.5}
                    label={{ value: 'R', position: 'right', fill: '#f44336' }}
                  />
                ))}

                {/* Stop Loss et Take Profit */}
                {riskManagement.stopLoss && (
                  <ReferenceLine 
                    y={riskManagement.stopLoss}
                    stroke="#f44336"
                    label={{ value: 'Stop Loss', position: 'left', fill: '#f44336' }}
                  />
                )}
                {riskManagement.takeProfit && (
                  <ReferenceLine 
                    y={riskManagement.takeProfit}
                    stroke="#4caf50"
                    label={{ value: 'Take Profit', position: 'left', fill: '#4caf50' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </Paper>
          )}

          {/* Indicateurs Techniques */}
          {activeTab === 1 && (
          <Paper elevation={3} sx={{ p: 2 }}>
            {/* Alertes de Manipulation */}
            {indicators.manipulation && indicators.manipulation.isManipulated && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Manipulation Détectée</AlertTitle>
                {indicators.manipulation.details.map((detail, index) => (
                  <Typography key={index} variant="body2">{detail}</Typography>
                ))}
                <Box sx={{ mt: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={indicators.manipulation.confidence * 100}
                    color="warning"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Confiance: {(indicators.manipulation.confidence * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Alert>
            )}

            {/* Divergences RSI */}
            {indicators.rsiDivergence && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>Divergences RSI</Typography>
                <Grid container spacing={2}>
                  {indicators.rsiDivergence.bullish && (
                    <Grid item xs={6}>
                      <Alert severity="success">
                        <AlertTitle>Divergence Haussière</AlertTitle>
                        <Typography variant="body2">
                          Le prix fait des bas plus bas mais le RSI fait des bas plus hauts
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                  {indicators.rsiDivergence.bearish && (
                    <Grid item xs={6}>
                      <Alert severity="error">
                        <AlertTitle>Divergence Baissière</AlertTitle>
                        <Typography variant="body2">
                          Le prix fait des hauts plus hauts mais le RSI fait des hauts plus bas
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Tendance</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">SMA 20</Typography>
                    <Typography variant="body1" color="primary">
                      {indicators.sma20 ? indicators.sma20.toLocaleString(undefined, {maximumFractionDigits: 2}) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Position</Typography>
                    <Typography 
                      variant="body1" 
                      color={currentPrice > indicators.sma20 ? 'success.main' : 'error.main'}
                    >
                      {currentPrice > indicators.sma20 ? 'Au-dessus' : 'En-dessous'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">MACD</Typography>
                    <Typography 
                      variant="body1" 
                      color={
                        !indicators.macd ? 'text.secondary' :
                        indicators.macd.histogram > 0 ? 'success.main' : 'error.main'
                      }
                    >
                      {indicators.macd ? indicators.macd.macd.toFixed(2) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Signal MACD</Typography>
                    <Typography variant="body1" color="text.secondary">
                      {indicators.macd ? indicators.macd.signal.toFixed(2) : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Momentum</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">RSI</Typography>
                    <Typography 
                      variant="body1" 
                      color={
                        !indicators.rsi ? 'text.secondary' :
                        indicators.rsi > 70 ? 'error.main' :
                        indicators.rsi < 30 ? 'success.main' :
                        'text.secondary'
                      }
                    >
                      {indicators.rsi ? indicators.rsi.toFixed(2) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Interprétation</Typography>
                    <Typography 
                      variant="body1" 
                      color={
                        !indicators.rsi ? 'text.secondary' :
                        indicators.rsi > 70 ? 'error.main' :
                        indicators.rsi < 30 ? 'success.main' :
                        'text.secondary'
                      }
                    >
                      {!indicators.rsi ? 'N/A' :
                       indicators.rsi > 70 ? 'Suracheté' :
                       indicators.rsi < 30 ? 'Survendu' :
                       'Neutre'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">ATR (Volatilité)</Typography>
                    <Typography variant="body1" color="text.secondary">
                      {indicators.atr ? indicators.atr.toFixed(2) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Bandes de Bollinger</Typography>
                    <Typography variant="body2" color="text.secondary">
                      H: {indicators.bollinger ? indicators.bollinger.upper.toFixed(0) : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      B: {indicators.bollinger ? indicators.bollinger.lower.toFixed(0) : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Analyse de Confluence</Typography>
                <Divider sx={{ mb: 2 }} />
                {indicators.confluence && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Force du Signal: {(indicators.confluence.strength * 100).toFixed(1)}%
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {indicators.confluence.reasons.map((reason, index) => (
                        <Chip 
                          key={index}
                          label={reason}
                          color={
                            reason.includes('suracheté') || reason.includes('résistance') ? 'error' :
                            reason.includes('survendu') || reason.includes('support') ? 'success' :
                            'default'
                          }
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Niveaux de Fibonacci</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {indicators.fibonacci && Object.entries(indicators.fibonacci).map(([key, value]) => (
                    <Grid item xs={6} md={3} key={key}>
                      <Typography variant="subtitle2">{key.replace('level', '')}</Typography>
                      <Typography 
                        variant="body1" 
                        color={
                          currentPrice > value ? 'success.main' :
                          currentPrice < value ? 'error.main' :
                          'primary'
                        }
                      >
                        ${value.toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Paper>
          )}

          {/* Analyse */}
          {activeTab === 2 && (
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Analyse Détaillée</Typography>
            <Divider sx={{ mb: 2 }} />
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {/* Signal et Confiance */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 1 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Signal: <span style={{ backgroundColor: '#ffd700', color: 'black', padding: '0 4px', borderRadius: '2px' }}>{tradingSignal.signal}</span>
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Confiance: {(tradingSignal.confidence * 100).toFixed(1)}%
                  </Typography>
                </Box>

                {/* Analyse simplifiée */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                    Prix et tendance:
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Le prix actuel de Bitcoin à <span style={{ backgroundColor: '#ffd700', color: 'black', padding: '0 4px', borderRadius: '2px' }}>${currentPrice.toLocaleString()}</span> est {currentPrice > indicators.sma20 ? 'au-dessus' : 'en-dessous'} de la SMA20 (${indicators.sma20?.toFixed(2)}), ce qui indique une {currentPrice > indicators.sma20 ? 'tendance haussière' : 'pression baissière'} à court terme.
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                    Momentum et force:
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Le RSI à <span style={{ backgroundColor: '#ffd700', color: 'black', padding: '0 4px', borderRadius: '2px' }}>{indicators.rsi?.toFixed(2)}</span> est {
                      indicators.rsi > 70 ? 'en zone de surachat (>70)' : 
                      indicators.rsi < 30 ? 'en zone de survente (<30)' : 
                      'dans une zone neutre'
                    }. Le MACD montre un histogramme {indicators.macd?.histogram > 0 ? 'positif' : 'négatif'} ({indicators.macd?.histogram.toFixed(2)}), indiquant une {indicators.macd?.histogram > 0 ? 'dynamique haussière' : 'dynamique baissière'}.
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                    Volatilité et sentiment:
                  </Typography>
                  <Typography variant="body1" paragraph>
                    L'ATR à {indicators.atr?.toFixed(2)} indique une volatilité {indicators.atr > 1000 ? 'élevée' : indicators.atr > 500 ? 'modérée' : 'faible'}. L'indice Peur & Avidité à <span style={{ backgroundColor: '#ffd700', color: 'black', padding: '0 4px', borderRadius: '2px' }}>{sentiment.fearGreedIndex}/100</span> reflète {
                      sentiment.fearGreedIndex > 70 ? 'une avidité extrême' : 
                      sentiment.fearGreedIndex > 50 ? 'un optimisme modéré' : 
                      sentiment.fearGreedIndex > 30 ? 'une neutralité' : 
                      sentiment.fearGreedIndex > 10 ? 'une peur modérée' : 
                      'une peur extrême'
                    } sur le marché.
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                    Niveaux clés:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {indicators.supports?.map((support, i) => (
                      <Chip 
                        key={`support-${i}`}
                        label={`Support: $${support.toFixed(0)}`}
                        color="success"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    ))}
                    {indicators.resistances?.map((resistance, i) => (
                      <Chip 
                        key={`resistance-${i}`}
                        label={`Résistance: $${resistance.toFixed(0)}`}
                        color="error"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                    Gestion du risque:
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Stop Loss: <span style={{ backgroundColor: '#ffd700', color: 'black', padding: '0 4px', borderRadius: '2px' }}>${riskManagement.stopLoss?.toFixed(0)}</span> | 
                    Take Profit: <span style={{ backgroundColor: '#ffd700', color: 'black', padding: '0 4px', borderRadius: '2px' }}>${riskManagement.takeProfit?.toFixed(0)}</span>
                  </Typography>
                </Box>

                {/* Conclusion */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                    Conclusion:
                  </Typography>
                  <Typography variant="body1">
                    Le signal actuel est <span style={{ backgroundColor: '#ffd700', color: 'black', padding: '0 4px', borderRadius: '2px' }}>{tradingSignal.signal}</span> avec une confiance de {(tradingSignal.confidence * 100).toFixed(1)}%. 
                    {tradingSignal.signal === 'ACHETER' ? 
                      ' Les indicateurs techniques montrent des conditions favorables pour une entrée en position.' : 
                      tradingSignal.signal === 'VENDRE' ? 
                      ' Les indicateurs techniques suggèrent une faiblesse du marché et une opportunité de sortie.' : 
                      ' Les signaux sont mixtes, il est préférable d\'attendre une confirmation plus claire avant de prendre position.'}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
          )}

          {/* Prédictions */}
          {activeTab === 3 && (
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Prédictions de Prix</Typography>
            <Divider sx={{ mb: 2 }} />
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {/* Direction et Confiance */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 1 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Tendance Prévue: <span style={{ backgroundColor: '#ffd700', color: 'black', padding: '0 4px', borderRadius: '2px' }}>{prediction.direction}</span>
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Confiance: {(prediction.confidence * 100).toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={prediction.confidence * 100}
                    color={prediction.confidence > 0.7 ? 'success' : prediction.confidence > 0.4 ? 'warning' : 'error'}
                    sx={{ mt: 1 }}
                  />
                </Box>

                {/* Fourchettes de Prix */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2, bgcolor: 'background.paper' }}>
                      <Typography variant="subtitle1" color="primary" gutterBottom>
                        Prévision 1 Heure
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="error.main">
                          Min: ${prediction.priceRanges.oneHour.min.toLocaleString(undefined, {maximumFractionDigits: 0})}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          Max: ${prediction.priceRanges.oneHour.max.toLocaleString(undefined, {maximumFractionDigits: 0})}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Confiance: {(prediction.priceRanges.oneHour.confidence * 100).toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2, bgcolor: 'background.paper' }}>
                      <Typography variant="subtitle1" color="primary" gutterBottom>
                        Prévision 4 Heures
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="error.main">
                          Min: ${prediction.priceRanges.fourHours.min.toLocaleString(undefined, {maximumFractionDigits: 0})}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          Max: ${prediction.priceRanges.fourHours.max.toLocaleString(undefined, {maximumFractionDigits: 0})}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Confiance: {(prediction.priceRanges.fourHours.confidence * 100).toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Niveaux Clés */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Niveaux Clés à Surveiller
                  </Typography>
                  <Grid container spacing={2}>
                    {prediction.keyLevels.targets.map((target, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Paper elevation={2} sx={{ p: 2, bgcolor: 'background.paper' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            {target.type === 'SUPPORT' ? 'Support Cible' : 'Résistance Cible'}
                          </Typography>
                          <Typography variant="h6" color={target.type === 'SUPPORT' ? 'success.main' : 'error.main'}>
                            ${target.price.toLocaleString(undefined, {maximumFractionDigits: 0})}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Confiance: {(target.confidence * 100).toFixed(1)}%
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Raisons et Risques */}
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Raisons
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {prediction.reasons.map((reason, index) => (
                        <Chip 
                          key={index}
                          label={reason}
                          color="primary"
                          size="small"
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" color="error" gutterBottom>
                      Risques
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {prediction.risks.map((risk, index) => (
                        <Chip 
                          key={index}
                          label={risk}
                          color="error"
                          size="small"
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
          )}

          {/* Historique des Signaux */}
          {activeTab === 4 && (
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Historique des Signaux</Typography>
            <Divider sx={{ mb: 2 }} />
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : signalHistory.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  Aucun signal enregistré
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Les signaux apparaîtront ici lorsque des changements significatifs seront détectés.
                </Typography>
              </Box>
            ) : (
              <Box>
                {signalHistory.map((signal, index) => (
                  <Box key={index} sx={{ mb: 2, p: 1, borderLeft: 4, 
                    borderColor: signal.signal === 'ACHETER' ? 'success.main' : 
                                signal.signal === 'VENDRE' ? 'error.main' : 'text.secondary' 
                  }}>
                    <Grid container alignItems="center">
                      <Grid item xs={3}>
                        <Typography variant="body2" color="text.secondary">
                          {signal.time}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Chip 
                          label={signal.signal} 
                          size="small"
                          color={
                            signal.signal === 'ACHETER' ? 'success' : 
                            signal.signal === 'VENDRE' ? 'error' : 
                            'default'
                          }
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body2">
                          ${signal.price.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body2" color="text.secondary">
                          Confiance: {(signal.confidence * 100).toFixed(0)}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
