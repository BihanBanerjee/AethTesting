'use client'

import { useContext } from 'react';
import { IntentClassifierContext } from '../context/intent-classifier-context';

export const useIntentClassifier = () => useContext(IntentClassifierContext);