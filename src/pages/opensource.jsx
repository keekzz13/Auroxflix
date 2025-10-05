mport React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { ExternalLink, Check, X, AlertTriangle, Code, Users, Globe } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

const OpenSource = () => {
  return (
    <div className="min-h-screen bg-[#090a0a] pb-12 md:pb-0">
      <Header />
      
      <div className="pt-8 md:pt-36 px-8 pb-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Open Source & Free
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            NepoFlix is open source and licensed under the General Public License V3.
            Below is a bunch of information for users, developers and people who may want to host NepoFlix for themselves.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://github.com/Sandipeyy/NepoFlix" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <FontAwesomeIcon icon={faGithub} className="!w-5 !h-5 mb-[0.05rem]" />
              View on GitHub
              <ExternalLink className="w-4 h-4" />
            </a>
            <a 
              href="https://github.com/Sandipeyy/NepoFlix/blob/main/LICENSE" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors"
            >
              View License
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Code className="w-8 h-8 text-blue-400" />
            What is GPL-3.0?
          </h2>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <p className="text-gray-300 text-lg leading-relaxed">
              The GNU General Public License version 3.0 is copyleft, meaning it 
              gives users the freedom to run, study, share, and modify the software. It's designed to ensure that NepoFlix
              remains free and open for everyone. If you are thinking about using NepoFlix to make your own pirating site,
              you should probably read it:
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Check className="w-8 h-8 text-green-400" />
            What You CAN Do
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20">
              <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" />
                For Users
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  Use NepoFlix for completely free
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  Share the website with friends and family
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  Learn how NepoFlix works under the hood
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  Request features or report bugs
                </li>
              </ul>
            </div>

            <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20">
              <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Code className="w-5 h-5 text-green-400" />
                For Developers/Hosters
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  Host your own instance for personal/commercial use
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  Modify the software for your specific needs
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  Run it on your own servers or cloud infrastructure
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  Customize the UI and features as needed
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <X className="w-8 h-8 text-red-400" />
            What You CANNOT Do
          </h2>
          <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                <div>
                  <strong className="text-white">Create proprietary derivatives:</strong> You cannot take NepoFlix's code, 
                  modify it, and release it under a different license or as closed-source software.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                <div>
                  <strong className="text-white">Remove license notices:</strong> You must keep all copyright notices 
                  and license information intact in any distribution.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                <div>
                  <strong className="text-white">Use without providing source:</strong> If you distribute modified versions, 
                  you must make the source code available under GPL-3.0.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                <div>
                  <strong className="text-white">Add additional restrictions:</strong> You cannot add terms that further 
                  restrict the rights granted by the GPL-3.0 license.
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
            Important Considerations
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/20">
              <h3 className="text-xl font-semibold text-white mb-3">For Hosting Services</h3>
              <p className="text-gray-300 mb-3">
                If you want to offer NepoFlix as a hosted service:
              </p>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• You must provide the source code to your users</li>
                <li>• Any modifications must be released under GPL-3.0</li>
                <li>• You must include proper attribution and license notices</li>
                <li>• Users must be informed of their rights under the license</li>
              </ul>
            </div>

            <div className="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/20">
              <h3 className="text-xl font-semibold text-white mb-3">For Developers</h3>
              <p className="text-gray-300 mb-3">
                When contributing or using the code:
              </p>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Your contributions will be under GPL-3.0</li>
                <li>• You cannot mix with incompatible licenses</li>
                <li>• Derivative works must also be GPL-3.0</li>
                <li>• Patent rights are explicitly addressed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default OpenSource;
