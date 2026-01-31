<div align="center">

# 🌌 FabricBEyeAI

### AI-Powered 3D Visualization for Microsoft Fabric Governance & Lineage

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Now-blue?style=for-the-badge)](https://Fabric-Lineage.github.io/FabricBEyeAI/)
[![GitHub Stars](https://img.shields.io/github/stars/Fabric-Lineage/FabricBEyeAI?style=for-the-badge)](https://github.com/Fabric-Lineage/FabricBEyeAI/stargazers)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Transform your Microsoft Fabric tenant into an interactive 3D universe** - Visualize workspaces, track lineage across 23 artifact types, and govern your data estate with unprecedented clarity.

[🎯 Features](#-features) • [🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🤝 Contributing](#-contributing)

![FabricBEyeAI 3D Visualization](docs/assets/screenshot-preview.png)

</div>

---

## 🎯 Features

### 🌐 **Complete Fabric Ecosystem Coverage**
- **23 Artifact Types** - From Lakehouses to ML Models, Notebooks to Eventstreams
- **Domain-Based Clustering** - Visualize organizational structure with Microsoft Fabric domains
- **Real-Time Lineage** - Track data flow across Semantic Models, Dataflows, Lakehouses, and Reports
- **Cross-Workspace Dependencies** - See how artifacts connect across your entire tenant

### 🎨 **Intuitive 3D Visualization**
- **Interactive 3D Graph** - Powered by Three.js and 3d-force-graph
- **Smart Clustering** - Automatic spatial organization by domains and workspaces
- **Focus Mode** - Isolate specific workspaces or domains for detailed analysis
- **Advanced Filtering** - Search by name, filter by type, hide/show artifact categories
- **Fog Effects** - Depth perception for complex tenants with thousands of objects

### 🏷️ **Enterprise Governance**
- **Official Microsoft Badges** - Certified and Promoted endorsement visualization
- **Sensitivity Labels** - Confidential, Highly Confidential, Internal, Public classification
- **Domain Management** - Assign unassigned workspaces with smart domain suggestions
- **Batch Operations** - Manage multiple workspace assignments efficiently

### 🔌 **Flexible Data Sources**
- **Scanner API Integration** - Direct tenant scanning with Microsoft Fabric Admin API
- **JSON File Import** - Load pre-scanned data for offline analysis
- **Mock Data Support** - Demo mode with 50+ sample workspaces for testing

---

## 🚀 Quick Start

### Prerequisites
- **Microsoft Fabric Admin Access** - Tenant-level permissions required
- **Node.js** 16+ and npm 8+
- **Modern Browser** - Chrome, Edge, or Firefox (WebGL support required)

### Installation

```bash
# Clone the repository
git clone https://github.com/Fabric-Lineage/FabricBEyeAI.git
cd FabricBEyeAI

# Install dependencies
npm install

# Start development server
npm start
```

Navigate to `http://localhost:4200` - The app will automatically reload on file changes.

### Using with Your Tenant

1. **Login** - Click the login button and authenticate with your Microsoft Fabric credentials
2. **Scan** - Initiate a workspace scan or import a JSON file
3. **Explore** - Navigate the 3D visualization with mouse/trackpad
4. **Analyze** - Use filters, focus mode, and domain clustering to understand your data estate

---

## 📊 Supported Artifacts

<table>
<tr>
<td valign="top" width="50%">

### Data Engineering
- 🏗️ **Lakehouse** - Data lake + lakehouse
- 🏢 **Data Warehouse** - SQL storage
- 📓 **Notebook** - Spark notebooks
- ⚡ **Spark Job Definition**

### Data Integration  
- 🔄 **Pipeline** - ETL orchestration
- 💧 **Dataflow Gen2** - Data prep
- 💧 **Dataflow** - Legacy Gen1

### Real-Time Analytics
- 📡 **Eventstream** - Streaming data
- 📊 **KQL Database** - Real-time analytics
- 🔍 **KQL Queryset** - Query collections
- 🏛️ **Eventhouse** - Analytics cluster

</td>
<td valign="top" width="50%">

### Traditional Power BI
- 📂 **Workspace** - Container for artifacts
- 📈 **Report** - Interactive reports
- 📄 **Paginated Report** - Pixel-perfect reports
- 📊 **Dashboard** - Pinned visualizations
- 🗄️ **Semantic Model** - Dataset/data model

### Data Science
- 🤖 **ML Model** - Machine learning models
- 🧪 **ML Experiment** - Training experiments

### Other
- 📦 **Datamart** - Self-service analytics
- 🔗 **SQL Analytics Endpoint** - Auto-created
- 📱 **App** - Published app bundles

</td>
</tr>
</table>

---

## 🎮 Usage Guide

### Navigation Controls

| Action | Control |
|--------|---------|
| **Rotate View** | Left Mouse Drag |
| **Pan View** | Right Mouse Drag |
| **Zoom** | Mouse Wheel |
| **Select Node** | Click |
| **Multi-Select** | Ctrl + Click |

### Key Features

#### 🎯 Focus Mode
Isolate specific workspaces or domains to reduce visual complexity:
- Click domain name to focus on that domain
- Click workspace to focus on workspace artifacts
- Press ESC or click "Show All" to reset

#### 🔍 Advanced Filtering
- **Search Bar** - Find artifacts by name (case-insensitive)
- **Type Filters** - Show/hide specific artifact types
- **Fog Toggle** - Enable depth fog for large tenants
- **Unassigned Toggle** - Hide/show workspaces without domains

#### 🏷️ Domain Management
Assign workspaces to domains with smart suggestions:
1. Open Domain Assignment panel
2. Select unassigned workspaces
3. Choose target domain from suggestions
4. Click "Assign Selected" to apply

#### 💾 Export Capabilities
- **Screenshot** - Export PNG image of current view
- **JSON Export** - Save complete graph data for offline analysis

---

## 🛠️ Technology Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | Angular 17, TypeScript 5.2 |
| **3D Rendering** | Three.js, 3d-force-graph v1.73 |
| **UI Framework** | Angular Material |
| **State Management** | RxJS Observables |
| **Build System** | Angular CLI, Webpack |
| **API Integration** | Microsoft Fabric Admin Scanner API v1.0 |

</div>

---

## 📖 Documentation

- **[Developer Guide](README_DEVELOPERS.md)** - Architecture, data flow, and code structure
- **[Supported Artifacts](SUPPORTED_ARTIFACTS.md)** - Complete artifact type reference
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- **[Refactoring Summary](REFACTORING_SUMMARY.md)** - Recent code improvements
- **[Migration Plan](docs/FABRIC_MIGRATION_PLAN.md)** - Fabric evolution roadmap

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'feat: Add AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Development Commands

```bash
npm start              # Start dev server (localhost:4200)
npm run build          # Production build
npm run docs           # Build for GitHub Pages
npm test               # Run unit tests
npm run lint           # Run ESLint
npm run e2e            # Run end-to-end tests
```

---

## 🌟 Why FabricBEyeAI?

### The Challenge
Modern data platforms are **complex, interconnected ecosystems**. Understanding:
- How data flows across your tenant
- Which workspaces depend on which datasets
- What artifacts are certified vs. uncertified
- How to organize and govern at scale

...is nearly impossible with flat lists and tables.

### The Solution
**FabricBEyeAI transforms complexity into clarity** through:
- **3D Spatial Organization** - Natural clustering by domains and workspaces
- **Visual Lineage** - See connections at a glance, not buried in metadata
- **Interactive Exploration** - Navigate, filter, and focus on what matters
- **Governance Integration** - Endorsements, labels, and domain management

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Original Creator** - Assaf Shemesh ([@assafsun](https://github.com/assafsun))
- **Microsoft Fabric Team** - For the comprehensive Admin Scanner API
- **Open Source Libraries** - Three.js, Angular, 3d-force-graph contributors
- **Community Contributors** - Everyone who has submitted issues, PRs, and feedback

---

## 🔗 Links

- **Live Demo**: [Fabric-Lineage.github.io/FabricBEyeAI](https://Fabric-Lineage.github.io/FabricBEyeAI/)
- **GitHub Issues**: [Report Bugs](https://github.com/Fabric-Lineage/FabricBEyeAI/issues)
- **Discussions**: [Ask Questions](https://github.com/Fabric-Lineage/FabricBEyeAI/discussions)

---

<div align="center">

**⭐ Star this repo** if you find FabricBEyeAI useful!

Made with ❤️ by the Fabric Lineage Community

</div>
