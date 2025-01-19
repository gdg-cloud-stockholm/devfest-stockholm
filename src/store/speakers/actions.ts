import { Dispatch } from 'redux';
import { SpeakerWithTags } from '../../models/speaker';
import {
  FETCH_SPEAKERS,
  FETCH_SPEAKERS_FAILURE,
  FETCH_SPEAKERS_SUCCESS,
  SpeakerActions,
} from './types';

export const fetchSpeakers = async (dispatch: Dispatch<SpeakerActions>) => {
  dispatch({ type: FETCH_SPEAKERS });
  
  let data: SpeakerWithTags[] = [];
  fetch('https://sessionize.com/api/v2/3awa7p55/view/SpeakerWall')
    .then(response => response.json())
    .then(speakers => { 
      speakers.forEach((speaker: SessionizeSpeaker) => {
        const speakerData: SpeakerWithTags = {
          id: speaker.id,
          badges: [], // Or map from speaker.badges if available
          bio: speaker.tagLine, // Or use speaker.bio if available
          company: '', // Or use speaker.company if available
          companyLogo: '', 
          companyLogoUrl: '',
          country: '', // Or use speaker.country if available
          featured: speaker.isTopSpeaker, // Using isTopSpeaker as a proxy for featured
          name: speaker.fullName,
          order: 0, // Or use speaker.order if available
          photo: speaker.profilePicture,
          photoUrl: speaker.profilePicture,
          pronouns: '', // Or use speaker.pronouns if available
          shortBio: '',
          socials: [], // Or map from speaker.socials if available
          title: '', // Or use speaker.title if available
          tags: [], // Or use speaker.tags if available
        };

        data.push(speakerData);
      });

      dispatch({ type: FETCH_SPEAKERS_SUCCESS, payload: data })
    })
    .catch(error => {
      console.error('Error fetching speaker data:', error);
      const e: Error = new Error(error.message);
      dispatch({ type: FETCH_SPEAKERS_FAILURE, payload: e })
    });
};

interface SessionizeSpeaker {
  id: string; 
  firstName: string;
  lastName: string;
  fullName: string;
  tagLine: string; 
  profilePicture: string;
  isTopSpeaker: boolean;
}