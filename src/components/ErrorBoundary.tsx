import * as React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State;
  public declare props: Props;
  public declare setState: (state: Partial<State> | ((prevState: State, props: Props) => Partial<State>), callback?: () => void) => void;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
    this.handleReset = this.handleReset.bind(this);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset() {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-8 max-w-xl mx-auto my-8 text-center space-y-6 shadow-2xl animate-fadeIn">
          <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/40">
            <AlertTriangle size={36} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">
              Ocurrió un inconveniente al cargar esta sección
            </h2>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              {this.state.error?.message || 'Error inesperado durante la visualización del componente.'}
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-left text-[11px] font-mono text-slate-400 overflow-x-auto max-h-32">
            {this.state.error?.stack || 'No stack trace available'}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs font-mono transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <RefreshCw size={15} />
              <span>Reintentar Cargar Módulo</span>
            </button>
            <button
              onClick={() => {
                this.handleReset();
                window.location.href = window.location.pathname;
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs font-mono transition flex items-center gap-2 cursor-pointer border border-slate-700"
            >
              <Home size={15} />
              <span>Volver a Inicio</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
