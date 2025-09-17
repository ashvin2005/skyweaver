import { AstroEvent } from './supabase';
import { fetchAllAstroEvents, fetchSIMBADObjects } from './astro-fetchers';

export interface CorrelationParams {
  timeWindowSeconds: number;
  angularThresholdDeg: number;
  minConfidenceScore?: number;
}

export interface EventPair {
  event1: AstroEvent;
  event2: AstroEvent;
  timeDiffSeconds: number;
  angularSeparationDeg: number;
  correlationType: string;
  confidenceScore: number;
}

export class CorrelationEngine {
  // Calculate angular separation between two points on the sky
  static calculateAngularSeparation(ra1: number, dec1: number, ra2: number, dec2: number): number {
    const toRad = Math.PI / 180;
    const ra1Rad = ra1 * toRad;
    const dec1Rad = dec1 * toRad;
    const ra2Rad = ra2 * toRad;
    const dec2Rad = dec2 * toRad;

    const deltaRA = ra2Rad - ra1Rad;
    const deltaDec = dec2Rad - dec1Rad;

    const a = Math.sin(deltaDec / 2) ** 2 + 
              Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.sin(deltaRA / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return c / toRad; // Convert back to degrees
  }

  // Calculate time difference in seconds
  static calculateTimeDifference(time1: string, time2: string): number {
    const date1 = new Date(time1);
    const date2 = new Date(time2);
    return Math.abs(date2.getTime() - date1.getTime()) / 1000;
  }

  // Calculate confidence score based on time and spatial proximity
  static calculateConfidenceScore(
    timeDiffSeconds: number, 
    angularSepDeg: number, 
    params: CorrelationParams
  ): number {
    const timeScore = Math.max(0, 1 - (timeDiffSeconds / params.timeWindowSeconds));
    const spatialScore = Math.max(0, 1 - (angularSepDeg / params.angularThresholdDeg));
    
    // Weighted combination (time is more important for multi-messenger events)
    return 0.7 * timeScore + 0.3 * spatialScore;
  }

  // Determine correlation type based on event types
  static getCorrelationType(event1: AstroEvent, event2: AstroEvent): string {
    const types = [event1.event_type, event2.event_type].sort();
    
    if (types.includes('gravitational_wave') && types.includes('gamma_ray_burst')) {
      return 'gw_grb';
    } else if (types.includes('gravitational_wave') && types.includes('optical_transient')) {
      return 'gw_optical';
    } else if (types.includes('gamma_ray_burst') && types.includes('optical_transient')) {
      return 'grb_optical';
    } else if (types.includes('gravitational_wave') && types.includes('gamma_ray_burst') && types.includes('optical_transient')) {
      return 'multi_messenger';
    } else {
      return 'same_type';
    }
  }

  // Main correlation function
  static async correlateEvents({ timeWindowSeconds = 600, angularThresholdDeg = 1.0 }): Promise<EventPair[]> {
    const events = await fetchAllAstroEvents();
    const results: EventPair[] = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        const timeDiff = this.calculateTimeDifference(event1.time_utc, event2.time_utc);
        const angularSep = this.calculateAngularSeparation(
          event1.ra, event1.dec, event2.ra, event2.dec
        );

        // Check if events meet correlation criteria
        if (timeDiff <= timeWindowSeconds && angularSep <= angularThresholdDeg) {
          const confidenceScore = this.calculateConfidenceScore(timeDiff, angularSep, { timeWindowSeconds, angularThresholdDeg });
          
          if (!params.minConfidenceScore || confidenceScore >= params.minConfidenceScore) {
            // Cross-messenger flag
            const crossMessenger = event1.source !== event2.source && event1.event_type !== event2.event_type;

            // Nearby objects (optional)
            const objects = await fetchSIMBADObjects(event1.ra, event1.dec);

            results.push({
              event1,
              event2,
              timeDiffSeconds: timeDiff,
              angularSeparationDeg: angularSep,
              correlationType: this.getCorrelationType(event1, event2),
              confidenceScore,
              crossMessenger,
              nearbyObjects: objects
            });
          }
        }
      }
    }

    // Sort by confidence score (highest first)
    return results.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  // Find event clusters (groups of correlated events)
  static findEventClusters(correlations: EventPair[]): AstroEvent[][] {
    const clusters: AstroEvent[][] = [];
    const processedEvents = new Set<string>();

    for (const correlation of correlations) {
      if (!processedEvents.has(correlation.event1.id) && !processedEvents.has(correlation.event2.id)) {
        const cluster = [correlation.event1, correlation.event2];
        processedEvents.add(correlation.event1.id);
        processedEvents.add(correlation.event2.id);
        
        // Find other events that correlate with this cluster
        for (const otherCorr of correlations) {
          if (otherCorr !== correlation) {
            if ((cluster.some(e => e.id === otherCorr.event1.id) && !processedEvents.has(otherCorr.event2.id)) ||
                (cluster.some(e => e.id === otherCorr.event2.id) && !processedEvents.has(otherCorr.event1.id))) {
              const newEvent = cluster.some(e => e.id === otherCorr.event1.id) ? otherCorr.event2 : otherCorr.event1;
              cluster.push(newEvent);
              processedEvents.add(newEvent.id);
            }
          }
        }
        
        clusters.push(cluster);
      }
    }

    return clusters;
  }
}