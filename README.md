# SkyWeaver - Multi-Messenger Astrophysical Event Correlation System

SkyWeaver is an advanced prototype system for correlating astrophysical events across multiple observational channels. It combines gravitational wave detections, gamma-ray bursts, optical transients, and other multi-messenger astronomy data to identify potentially related cosmic events.

## Features

### Data Collection Layer
- **Multi-Source Integration**: Fetches data from GWOSC (gravitational waves), ZTF/TNS (optical transients), NASA HEASARC (gamma-ray bursts), and SIMBAD/Vizier (contextual catalogs)
- **Unified Schema**: Normalizes all events into a common format with event_id, source, event_type, coordinates, time, and metadata
- **Real-time Processing**: Supports both batch processing and streaming event correlation

### Correlation Engine
- **Time Correlation**: Matches events within user-defined time windows (±10 minutes to ±1 day)
- **Spatial Correlation**: Correlates events by sky position within angular thresholds (<1° to 10°)
- **Cross-Messenger Detection**: Identifies multi-messenger events across different observation types
- **Confidence Scoring**: Calculates correlation confidence based on temporal and spatial proximity

### Interactive Dashboard
- **Sky Map Visualization**: Interactive scatter plot showing event positions in RA/Dec coordinates
- **Event Timeline**: Chronological view of detected events with filtering capabilities
- **Correlation Network**: Visual representation of correlated event pairs and clusters
- **Dynamic Controls**: Real-time adjustment of correlation parameters

### Advanced Analytics
- **Event Clustering**: Groups related events into multi-messenger clusters
- **Statistical Analysis**: Provides correlation statistics and confidence metrics
- **Export Capabilities**: Download results in various formats for further analysis

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account (for database)
- Modern web browser with JavaScript enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd skyweaver
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new Supabase project
   - Click "Connect to Supabase" in the top right of the application
   - The database schema will be automatically created

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to access SkyWeaver

## System Architecture

### Frontend (Next.js)
- **Interactive Dashboard**: React components for data visualization
- **Sky Map**: Plotly.js-based celestial coordinate plotting
- **Event Management**: Real-time event list with filtering and search
- **Correlation Controls**: Dynamic parameter adjustment interface

### Backend API Routes
- `/api/events` - Event data management (GET/POST)
- `/api/correlate` - Correlation analysis endpoint
- `/api/sources` - Observatory/data source management

### Database (Supabase/PostgreSQL)
- **astro_events**: Main event storage with spatial/temporal indexing
- **event_correlations**: Correlation results with confidence scores
- **Row Level Security**: Secure data access with proper authentication

### Data Sources

#### Gravitational Waves (GWOSC)
- LIGO-Virgo collaboration data
- Binary black hole and neutron star mergers
- Strain data and parameter estimation

#### Gamma-Ray Bursts (HEASARC)
- Fermi-GBM and Swift-BAT detections
- Short and long GRB classifications
- Spectral and temporal analysis data

#### Optical Transients (ZTF/TNS)
- Zwicky Transient Facility discoveries
- Supernovae, kilonovae, and other transients
- Photometric and spectroscopic follow-up

#### Contextual Data (SIMBAD/Vizier)
- Host galaxy information
- Stellar catalogs and object classifications
- Distance measurements and proper motions

## Usage Guide

### Basic Operation
1. **Data Loading**: Click "Refresh Data" to load the latest events
2. **Parameter Adjustment**: Use the correlation panel to set time windows and angular thresholds
3. **Correlation Analysis**: Click "Find Correlations" to identify related events
4. **Visualization**: Explore results on the interactive sky map
5. **Event Details**: Click on events for detailed metadata and analysis

### Advanced Features
- **Custom Time Windows**: Adjust from seconds to days based on physics expectations
- **Angular Correlation**: Set thresholds based on localization uncertainties
- **Multi-Messenger Filtering**: Focus on specific event type combinations
- **Confidence Thresholding**: Filter results by correlation strength

## Demo Data

The system includes synthetic test data representing:
- **GW150914**: First gravitational wave detection
- **GW170817**: Neutron star merger with electromagnetic counterparts
- **GRB170817A**: Associated gamma-ray burst
- **AT2017gfo**: Optical kilonova counterpart
- Additional simulated events for testing correlation algorithms

## API Documentation

### Events API
```javascript
// Fetch events with filters
GET /api/events?start_time=2017-08-17T00:00:00Z&event_type=gravitational_wave

// Add new events
POST /api/events
{
  "events": [
    {
      "event_id": "GW123456",
      "source": "LIGO-Virgo",
      "event_type": "gravitational_wave",
      "ra": 197.45,
      "dec": -23.38,
      "time_utc": "2023-01-01T12:00:00Z",
      "metadata": { "snr": 15.2, "distance": 100 }
    }
  ]
}
```

### Correlation API
```javascript
// Run correlation analysis
POST /api/correlate
{
  "timeWindowSeconds": 600,
  "angularThresholdDeg": 1.0,
  "minConfidenceScore": 0.1
}
```

## Deployment

### Vercel (Frontend)
1. Connect your GitHub repository to Vercel
2. Set environment variables for Supabase connection
3. Deploy with automatic builds on push

### Supabase (Database)
1. Database and API are automatically managed
2. Real-time subscriptions for live event updates
3. Built-in authentication and security

## Scientific Background

### Multi-Messenger Astronomy
Multi-messenger astronomy combines observations from different "messengers":
- **Gravitational Waves**: Spacetime distortions from accelerating masses
- **Electromagnetic Radiation**: Photons across all wavelengths
- **Neutrinos**: Nearly massless particles from nuclear processes
- **Cosmic Rays**: High-energy particles from extreme environments

### Correlation Physics
- **Binary Neutron Star Mergers**: Produce GWs, GRBs, and optical transients
- **Black Hole Mergers**: Primarily gravitational wave sources
- **Core-Collapse Supernovae**: Multi-wavelength electromagnetic emission
- **Active Galactic Nuclei**: Variable across multiple messengers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- **Machine Learning**: Automated event classification and correlation
- **Real-time Alerts**: Push notifications for high-confidence correlations
- **Advanced Visualization**: 3D sky maps and time-series analysis
- **API Integration**: Direct connections to live observatory data streams
- **Collaborative Features**: Multi-user analysis and annotation tools

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- LIGO-Virgo-KAGRA Collaboration for gravitational wave data
- Zwicky Transient Facility for optical transient discoveries
- NASA HEASARC for high-energy astrophysics data
- SIMBAD/CDS for astronomical catalogs
- The multi-messenger astronomy community

## Contact

For questions, suggestions, or collaboration opportunities, please open an issue or contact the development team.

---

**SkyWeaver** - Weaving together the cosmic web of multi-messenger astronomy 🌌


- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel



The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details....
