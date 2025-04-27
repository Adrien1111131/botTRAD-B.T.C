const GROK_API_KEY = 'xai-ZsHO7BbkPMfY69WykDUi7h6pE8RRGallak2DYVvf4jmZ9jfCWdcrI0QTz0sypLtUA8EbVySMrChg5GrV';

class GrokService {
  constructor() {
    this.baseUrl = 'https://api.x.ai/v1/chat/completions';
  }

  async analyzeMarket(price, historicalData, indicators, sentiment) {
    try {
      // En environnement de production (GitHub Pages), utiliser l'analyse de secours
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.log('Environnement de production détecté, utilisation de l\'analyse de secours');
        return this.generateFallbackAnalysis(price, historicalData, indicators, sentiment);
      }
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "Tu es un expert en analyse de marché Bitcoin. Analyse les données techniques et fondamentales pour fournir des recommandations de trading précises. Utilise des tirets pour structurer ton analyse en points clairs et concis. Mets en évidence les informations importantes."
            },
            {
              role: "user",
              content: `
                Analyse complète du Bitcoin:
                
                1. Prix et Tendances:
                - Prix actuel: $${price.toLocaleString()}
                - SMA20: ${indicators.sma20 ? indicators.sma20.toFixed(2) : 'N/A'}
                - Position par rapport à la SMA20: ${price > indicators.sma20 ? 'Au-dessus' : 'En-dessous'}

                2. Momentum et Force:
                - RSI: ${indicators.rsi ? indicators.rsi.toFixed(2) : 'N/A'} (Suracheté > 70, Survendu < 30)
                - MACD: ${indicators.macd ? 
                  `Ligne MACD: ${indicators.macd.macd.toFixed(2)}, 
                   Signal: ${indicators.macd.signal.toFixed(2)}, 
                   Histogramme: ${indicators.macd.histogram.toFixed(2)}` 
                  : 'N/A'}

                3. Volatilité et Niveaux:
                - ATR: ${indicators.atr ? indicators.atr.toFixed(2) : 'N/A'} (mesure de volatilité)
                - Bandes de Bollinger: ${indicators.bollinger ? 
                  `Haut: ${indicators.bollinger.upper.toFixed(2)},
                   Milieu: ${indicators.bollinger.middle.toFixed(2)},
                   Bas: ${indicators.bollinger.lower.toFixed(2)}`
                  : 'N/A'}
                - Supports récents: ${indicators.supports ? indicators.supports.join(', ') : 'N/A'}
                - Résistances récentes: ${indicators.resistances ? indicators.resistances.join(', ') : 'N/A'}

                4. Niveaux de Fibonacci:
                ${indicators.fibonacci ? 
                  `- 0%: ${indicators.fibonacci.level0.toFixed(2)}
                   - 23.6%: ${indicators.fibonacci.level236.toFixed(2)}
                   - 38.2%: ${indicators.fibonacci.level382.toFixed(2)}
                   - 50%: ${indicators.fibonacci.level50.toFixed(2)}
                   - 61.8%: ${indicators.fibonacci.level618.toFixed(2)}
                   - 78.6%: ${indicators.fibonacci.level786.toFixed(2)}
                   - 100%: ${indicators.fibonacci.level100.toFixed(2)}`
                  : 'N/A'}

                5. Analyse du Sentiment:
                - Indice Peur & Avidité: ${sentiment.fearGreedIndex}/100 (0 = Peur extrême, 100 = Avidité extrême)
                - Sentiment Social: ${sentiment.socialSentiment}
                - Force de la Tendance: ${sentiment.trendStrength.toFixed(1)}/10

                6. Historique récent: ${JSON.stringify(historicalData.slice(-5))}

                En te basant sur ces indicateurs techniques, fournis une analyse détaillée et une recommandation claire:
                1. Identifie les signaux convergents/divergents
                2. Évalue la force de la tendance actuelle
                3. Détermine les niveaux critiques à surveiller
                4. Fournis une recommandation (ACHETER, VENDRE, ou ATTENDRE) avec un niveau de confiance
                
                Format de réponse requis:
                1. **Signal**: [ACHETER/VENDRE/ATTENDRE]
                2. **Confiance**: [0-100%]
                3. **Analyse**:
                   - Point 1
                   - Point 2
                   - Point 3
                4. **Niveaux Clés**:
                   - Support 1: [valeur]
                   - Support 2: [valeur]
                   - Résistance 1: [valeur]
                   - Résistance 2: [valeur]
                5. **Gestion du Risque**:
                   - Stop-Loss: [valeur]
                   - Take-Profit: [valeur]
                   - Ratio Risque/Récompense: [valeur]
                6. **Sentiment**:
                   - Interprétation de l'indice Peur & Avidité
                   - Analyse du sentiment social
                7. **Horizon**: [Court/Moyen/Long terme]
                8. **Conclusion**: Résumé en une phrase
              `
            }
          ],
          model: "grok-3-latest",
          stream: false,
          temperature: 0
        })
      });

      const data = await response.json();
      return this.parseGrokResponse(data);
    } catch (error) {
      console.error('Erreur lors de l\'analyse du marché:', error);
      return this.generateFallbackAnalysis(price, historicalData, indicators, sentiment);
    }
  }

  parseGrokResponse(response) {
    try {
      const content = response.choices[0].message.content;
      
      // Parse la réponse pour extraire le signal et la confiance
      const signalMatch = content.match(/\*\*Signal\*\*:\s*(ACHETER|VENDRE|ATTENDRE)/i);
      const confidenceMatch = content.match(/\*\*Confiance\*\*:\s*(\d+)/);
      
      // Extraction des sections
      const analysisMatch = content.match(/\*\*Analyse\*\*:\s*([\s\S]*?)(?=\*\*Niveaux|$)/);
      const levelsMatch = content.match(/\*\*Niveaux Clés\*\*:\s*([\s\S]*?)(?=\*\*Gestion|$)/);
      const riskMatch = content.match(/\*\*Gestion du Risque\*\*:\s*([\s\S]*?)(?=\*\*Sentiment|$)/);
      const sentimentMatch = content.match(/\*\*Sentiment\*\*:\s*([\s\S]*?)(?=\*\*Horizon|$)/);
      const horizonMatch = content.match(/\*\*Horizon\*\*:\s*([\s\S]*?)(?=\*\*Conclusion|$)/);
      const conclusionMatch = content.match(/\*\*Conclusion\*\*:\s*([\s\S]*?)(?=$)/);

      // Formatage de la raison avec toutes les informations disponibles
      let formattedReason = '';
      
      // Analyse
      if (analysisMatch && analysisMatch[1]) {
        const analysis = analysisMatch[1].trim();
        formattedReason += analysis;
      }
      
      // Niveaux clés
      if (levelsMatch && levelsMatch[1]) {
        const levels = levelsMatch[1].trim();
        formattedReason += `\n\nNiveaux clés:\n${levels}`;
      }
      
      // Gestion du risque
      if (riskMatch && riskMatch[1]) {
        const risk = riskMatch[1].trim();
        formattedReason += `\n\nGestion du risque:\n${risk}`;
      }
      
      // Sentiment
      if (sentimentMatch && sentimentMatch[1]) {
        const sentimentAnalysis = sentimentMatch[1].trim();
        formattedReason += `\n\nSentiment:\n${sentimentAnalysis}`;
      }
      
      // Horizon
      if (horizonMatch && horizonMatch[1]) {
        const horizon = horizonMatch[1].trim();
        formattedReason += `\n\nHorizon:\n${horizon}`;
      }
      
      // Conclusion
      if (conclusionMatch && conclusionMatch[1]) {
        const conclusion = conclusionMatch[1].trim();
        formattedReason += `\n\nConclusion:\n${conclusion}`;
      }

      // Si aucune raison formatée n'est disponible, utiliser le contenu brut
      if (!formattedReason) formattedReason = content;

      return {
        signal: signalMatch ? signalMatch[1].toUpperCase() : 'ATTENDRE',
        confidence: confidenceMatch ? parseInt(confidenceMatch[1]) / 100 : 0.5,
        reason: formattedReason
      };
    } catch (error) {
      console.error('Erreur lors du parsing de la réponse:', error);
      return {
        signal: 'ATTENDRE',
        confidence: 0,
        reason: 'Erreur de parsing'
      };
    }
  }

  // Génère une analyse de secours si l'API Grok échoue
  generateFallbackAnalysis(price, historicalData, indicators, sentiment) {
    try {
      // Détermination du signal
      let signal = 'ATTENDRE';
      let confidence = 0.5;
      
      // Analyse basée sur les indicateurs techniques
      if (indicators.rsi > 70) {
        signal = 'VENDRE';
        confidence = 0.7;
      } else if (indicators.rsi < 30) {
        signal = 'ACHETER';
        confidence = 0.7;
      } else if (indicators.macd && indicators.macd.histogram > 0) {
        signal = 'ACHETER';
        confidence = 0.6;
      } else if (indicators.macd && indicators.macd.histogram < 0) {
        signal = 'VENDRE';
        confidence = 0.6;
      }
      
      // Ajustement basé sur les divergences RSI
      if (indicators.rsiDivergence) {
        if (indicators.rsiDivergence.bullish) {
          signal = 'ACHETER';
          confidence = Math.max(confidence, 0.75);
        } else if (indicators.rsiDivergence.bearish) {
          signal = 'VENDRE';
          confidence = Math.max(confidence, 0.75);
        }
      }
      
      // Ajustement basé sur la manipulation du marché
      if (indicators.manipulation && indicators.manipulation.isManipulated) {
        signal = 'ATTENDRE';
        confidence = 0.8;
      }
      
      // Construction de l'analyse structurée
      let reason = `**Signal**: ${signal}\n`;
      reason += `**Confiance**: ${Math.round(confidence * 100)}%\n\n`;
      
      reason += "**Analyse**:\n";
      reason += `- Prix actuel: $${price.toLocaleString()}\n`;
      reason += `- SMA20: ${indicators.sma20 ? indicators.sma20.toFixed(2) : 'N/A'} (${price > indicators.sma20 ? 'Prix au-dessus' : 'Prix en-dessous'})\n`;
      reason += `- RSI: ${indicators.rsi ? indicators.rsi.toFixed(2) : 'N/A'} (${indicators.rsi > 70 ? 'Suracheté' : indicators.rsi < 30 ? 'Survendu' : 'Neutre'})\n`;
      
      if (indicators.macd) {
        reason += `- MACD: ${indicators.macd.histogram > 0 ? 'Positif' : 'Négatif'} (${indicators.macd.histogram.toFixed(2)})\n`;
      }
      
      if (indicators.rsiDivergence) {
        if (indicators.rsiDivergence.bullish) {
          reason += "- Divergence haussière RSI détectée\n";
        } else if (indicators.rsiDivergence.bearish) {
          reason += "- Divergence baissière RSI détectée\n";
        }
      }
      
      if (indicators.manipulation && indicators.manipulation.isManipulated) {
        reason += `- Manipulation de marché détectée: ${indicators.manipulation.details.join(', ')}\n`;
      }
      
      reason += "\n**Niveaux Clés**:\n";
      if (indicators.supports && indicators.supports.length > 0) {
        indicators.supports.forEach((support, index) => {
          reason += `- Support ${index + 1}: $${support.toFixed(0)}\n`;
        });
      } else {
        reason += "- Supports: Non disponibles\n";
      }
      
      if (indicators.resistances && indicators.resistances.length > 0) {
        indicators.resistances.forEach((resistance, index) => {
          reason += `- Résistance ${index + 1}: $${resistance.toFixed(0)}\n`;
        });
      } else {
        reason += "- Résistances: Non disponibles\n";
      }
      
      reason += "\n**Gestion du Risque**:\n";
      if (indicators.atr) {
        const stopLoss = signal === 'ACHETER' ? price - (indicators.atr * 2) : price + (indicators.atr * 2);
        const takeProfit = signal === 'ACHETER' ? price + (indicators.atr * 4) : price - (indicators.atr * 4);
        
        reason += `- Stop-Loss: $${stopLoss.toFixed(0)}\n`;
        reason += `- Take-Profit: $${takeProfit.toFixed(0)}\n`;
        reason += "- Ratio Risque/Récompense: 1:2\n";
      } else {
        reason += "- Données ATR non disponibles pour le calcul\n";
      }
      
      reason += "\n**Sentiment**:\n";
      reason += `- Indice Peur & Avidité: ${sentiment.fearGreedIndex}/100 (${
        sentiment.fearGreedIndex > 70 ? 'Avidité extrême' : 
        sentiment.fearGreedIndex > 50 ? 'Avidité' : 
        sentiment.fearGreedIndex > 30 ? 'Neutre' : 
        sentiment.fearGreedIndex > 10 ? 'Peur' : 'Peur extrême'
      })\n`;
      reason += `- Sentiment Social: ${sentiment.socialSentiment}\n`;
      
      reason += "\n**Horizon**:\n";
      reason += "- Court terme (1-3 jours)\n";
      
      reason += "\n**Conclusion**:\n";
      reason += `Le signal actuel est ${signal} avec une confiance de ${Math.round(confidence * 100)}%, basé sur ${
        signal === 'ACHETER' ? 'des conditions techniques favorables' : 
        signal === 'VENDRE' ? 'des signaux de faiblesse du marché' : 
        'des signaux mixtes nécessitant plus de confirmation'
      }.`;
      
      return {
        signal,
        confidence,
        reason
      };
    } catch (error) {
      console.error('Erreur lors de la génération de l\'analyse de secours:', error);
      return {
        signal: 'ATTENDRE',
        confidence: 0,
        reason: 'Erreur lors de l\'analyse'
      };
    }
  }
}

export default new GrokService();
