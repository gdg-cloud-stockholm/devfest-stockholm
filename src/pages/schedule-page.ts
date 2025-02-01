import { customElement } from '@polymer/decorators';
import '@polymer/paper-progress';
import { html, PolymerElement } from '@polymer/polymer';
import '../components/hero/hero-block';
import '../elements/content-loader';
import '../elements/filter-menu';
import '../elements/header-bottom-toolbar';
import '../elements/shared-styles';
import '../elements/sticky-element';
import { ReduxMixin } from '../store/mixin';
import { heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';

@customElement('schedule-page')
export class SchedulePage extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          display: block;
          height: 100%;
        }

        .container {
          min-height: 60%;
          padding: 0;
        }

        .container .agenda {
          width: 100%;
        }

        paper-progress {
          width: 100%;
          --paper-progress-active-color: var(--default-primary-color);
          --paper-progress-secondary-color: var(--default-primary-color);
        }

        @media (max-width: 640px) {
          .container {
            padding: 0 0 32px;
          }
        }

        @media (min-width: 640px) {
          :host {
            background-color: #fff;
          }
        }
      </style>

      <hero-block
        background-image="[[heroSettings.background.image]]"
        background-color="[[heroSettings.background.color]]"
        font-color="[[heroSettings.fontColor]]"
      >
        <div class="hero-title">[[heroSettings.title]]</div>
        <p class="hero-description">[[heroSettings.description]]</p>
      </hero-block>

      <div class="container">
        <img class="agenda" src="/images/agenda/workshop.png" alt="Schedule" />
        <img class="agenda" src="/images/agenda/conference-morning.png" alt="Schedule" />
        <img class="agenda" src="/images/agenda/conference-afternoon.png" alt="Schedule" />
      </div>

      <footer-block></footer-block>
    `;
  }

  private heroSettings = heroSettings.schedule;

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(this.heroSettings.title, this.heroSettings.metaDescription);
  }
}