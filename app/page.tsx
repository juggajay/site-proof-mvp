import Link from 'next/link'
import { SiteProofLogo } from '../components/ui/site-proof-logo'
import { 
  Shield, 
  CheckCircle, 
  Users, 
  FileText, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Star,
  Building2,
  HardHat,
  Clipboard
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <SiteProofLogo size="md" showText={true} />
            <nav className="hidden md:flex space-x-8">
              <Link href="#features" className="text-slate-600 hover:text-blue-800 font-medium">
                Features
              </Link>
              <Link href="#benefits" className="text-slate-600 hover:text-blue-800 font-medium">
                Benefits
              </Link>
              <Link href="#pricing" className="text-slate-600 hover:text-blue-800 font-medium">
                Pricing
              </Link>
              <Link href="#contact" className="text-slate-600 hover:text-blue-800 font-medium">
                Contact
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-slate-600 hover:text-blue-800 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="site-proof-btn-primary"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Professional 
                <span className="text-blue-800"> Quality Assurance</span> for 
                <span className="text-yellow-500"> Australian Construction</span>
              </h1>
              <p className="text-xl text-slate-600 mt-6 leading-relaxed">
                Streamline your construction QA processes with Site-Proof's comprehensive digital platform. 
                Ensure compliance, reduce defects, and deliver projects on time and within budget.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/signup"
                  className="site-proof-btn-primary text-lg px-8 py-4"
                >
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="#demo"
                  className="site-proof-btn-tertiary text-lg px-8 py-4"
                >
                  Watch Demo
                </Link>
              </div>
              <div className="mt-8 flex items-center space-x-6 text-sm text-slate-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Professional QA software
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Australian owned & operated
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Project Dashboard</h3>
                    <span className="text-green-500 text-sm font-medium">98% Complete</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Quality Inspections</span>
                      <span className="text-slate-900 font-medium">47/50</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-blue-800 h-2 rounded-full" style={{width: '94%'}}></div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Defects Resolved</span>
                      <span className="text-slate-900 font-medium">23/25</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{width: '92%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need for Construction QA
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive tools designed specifically for Australian construction standards and regulations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center mb-6">
                <Clipboard className="h-6 w-6 text-blue-900" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Digital Inspections</h3>
              <p className="text-blue-100">
                Conduct thorough quality inspections with customizable checklists, photo documentation, and real-time reporting.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Compliance Management</h3>
              <p className="text-blue-800">
                Stay compliant with Australian building codes, safety regulations, and industry standards with automated tracking.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-blue-900" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Automated Reporting</h3>
              <p className="text-blue-100">
                Generate professional reports instantly with photos, data, and compliance documentation for stakeholders.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Team Collaboration</h3>
              <p className="text-blue-800">
                Connect project managers, supervisors, and QA teams with real-time updates and communication tools.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center mb-6">
                <Clock className="h-6 w-6 text-blue-900" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Real-Time Tracking</h3>
              <p className="text-blue-100">
                Monitor project progress, defect resolution, and quality metrics with live dashboards and notifications.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Analytics & Insights</h3>
              <p className="text-blue-800">
                Gain valuable insights into quality trends, team performance, and project efficiency with detailed analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                Trusted by Leading Australian Construction Companies
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Reduce Defects by 60%</h3>
                    <p className="text-slate-600">
                      Systematic quality checks and early detection prevent costly rework and delays.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Save 15 Hours Per Week</h3>
                    <p className="text-slate-600">
                      Streamlined processes and automated reporting eliminate manual paperwork and admin tasks.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">100% Compliance Assurance</h3>
                    <p className="text-slate-600">
                      Built-in Australian standards ensure every project meets regulatory requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 border">
              <div className="text-center mb-8">
                <div className="flex justify-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-lg text-slate-700 italic mb-4">
                  "Site-Proof has transformed our QA process. We've reduced defects significantly and our clients are impressed with the professional reporting."
                </blockquote>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-12 h-12 bg-blue-800 rounded-full flex items-center justify-center">
                    <HardHat className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-900">Sarah Mitchell</div>
                    <div className="text-slate-600 text-sm">Project Manager, BuildCorp Australia</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-800 to-blue-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Elevate Your Construction QA?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of Australian construction companies using Site-Proof to deliver higher quality projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="site-proof-btn-secondary text-lg px-8 py-4"
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="#contact" 
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-800 font-semibold px-8 py-4 rounded-lg transition-colors"
            >
              Schedule Demo
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-6">
            Professional QA software • Australian support team • Trusted by industry leaders
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <SiteProofLogo size="md" showText={true} variant="white" />
              <p className="text-slate-400 mt-4 max-w-md">
                Professional construction QA software designed for Australian building standards and regulations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#demo" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="#contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="#help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Site-Proof. All rights reserved. Australian owned and operated.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}