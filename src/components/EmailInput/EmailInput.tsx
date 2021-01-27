import React, {
  useCallback,
  useState,
  ChangeEvent as ReactChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
} from 'react';
import classNames from 'classnames';

import { getFilteredEmails } from './helpers';
import closeIcon from './assets/icons/close.png';
import errorCircleIcon from './assets/icons/error-circle.png';

import './EmailInput.css';

const EMAIL_REGEXP = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const AUTOCOMPLETE_ITEM_HEIGHT = 38;
const AUTOCOMPLETE_LIST_HEIGHT = 260;

export const EmailInput = () => {
  const [inputValue, setInputValue] = useState('');
  const [autocompleteItems, setAutocompleteItems] = useState<Array<string>>([]);
  const [selectedEmails, setSelectedEmails] = useState<Array<string>>([]);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(-1);
  const [autocompleteLeft, setAutocompleteLeft] = useState(0);

  const autocompleteList = useRef<HTMLDivElement>(null);
  const hiddenTextCalculationBlock = useRef<HTMLDivElement>(null);

  const handleAddSelectedEmail = useCallback(() => {
    if (inputValue !== '') {
      if (focusedItemIndex !== -1) {
        const selectedItem = autocompleteItems[focusedItemIndex];
        if (selectedItem && !selectedEmails.includes(selectedItem)) {
          setSelectedEmails([...selectedEmails, selectedItem]);
          setInputValue('');
        }
      } else {
        setSelectedEmails([...selectedEmails, inputValue]);
        setInputValue('');
      }
    }
  }, [
    selectedEmails,
    setSelectedEmails,
    autocompleteItems,
    focusedItemIndex,
    setInputValue,
    inputValue,
  ]);

  useEffect(() => {
    if (inputValue !== '') {
      getFilteredEmails(inputValue).then((emails) => {
        setAutocompleteItems(emails);
        setFocusedItemIndex(-1);
      });
    } else {
      setAutocompleteItems([]);
    }
  }, [inputValue, setAutocompleteItems]);

  const handleInputChange = useCallback(
    (e: ReactChangeEvent<HTMLInputElement>) => {
      setAutocompleteLeft(
        hiddenTextCalculationBlock.current?.getBoundingClientRect().width || 0
      );
      setInputValue(e.target.value.replace(' ', ''));
    },
    [setInputValue]
  );

  const handleRemoveLastSelectedAutocompleteItem = useCallback(() => {
    if (selectedEmails.length > 0) {
      setSelectedEmails(selectedEmails.slice(0, selectedEmails.length - 1));
    }
  }, [selectedEmails, setSelectedEmails]);

  const handleRemoveSelectedAutocompleteItemByIndex = useCallback(
    (idx: number) => () => {
      setSelectedEmails([
        ...selectedEmails.slice(0, idx),
        ...selectedEmails.slice(idx + 1),
      ]);
    },
    [selectedEmails, setSelectedEmails]
  );

  const handleSelectIndex = useCallback(
    (direction: 'next' | 'prev') => {
      if (direction === 'next') {
        const newFocusedItemIndex =
          focusedItemIndex === autocompleteItems.length - 1
            ? 0
            : focusedItemIndex + 1;
        setFocusedItemIndex(newFocusedItemIndex);

        const itemDistanceFromTop =
          AUTOCOMPLETE_ITEM_HEIGHT * newFocusedItemIndex;

        if (
          autocompleteList.current &&
          itemDistanceFromTop >
            autocompleteList.current.scrollTop +
              AUTOCOMPLETE_LIST_HEIGHT -
              2 * AUTOCOMPLETE_ITEM_HEIGHT
        ) {
          if (autocompleteList.current) {
            autocompleteList.current.scroll({
              top:
                itemDistanceFromTop -
                AUTOCOMPLETE_LIST_HEIGHT +
                2 * AUTOCOMPLETE_ITEM_HEIGHT,
            });
          }
        }

        if (autocompleteList.current && newFocusedItemIndex === 0) {
          autocompleteList.current.scroll({
            top: 0,
          });
        }
      }

      if (direction === 'prev') {
        const newFocusedItemIndex =
          focusedItemIndex <= 0
            ? autocompleteItems.length - 1
            : focusedItemIndex - 1;

        setFocusedItemIndex(newFocusedItemIndex);

        const itemDistanceFromTop =
          AUTOCOMPLETE_ITEM_HEIGHT * newFocusedItemIndex;

        if (
          autocompleteList.current &&
          itemDistanceFromTop < autocompleteList.current.scrollTop
        ) {
          if (autocompleteList.current) {
            autocompleteList.current.scroll({
              top: itemDistanceFromTop,
            });
          }
        }

        if (
          autocompleteList.current &&
          newFocusedItemIndex === autocompleteItems.length - 1
        ) {
          autocompleteList.current.scroll({
            top: itemDistanceFromTop,
          });
        }
      }
    },
    [setFocusedItemIndex, focusedItemIndex, autocompleteItems]
  );

  const handleInputKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          handleAddSelectedEmail();
          e.preventDefault();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleSelectIndex('prev');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleSelectIndex('next');
          break;
        case 'Backspace':
          if (inputValue === '') {
            handleRemoveLastSelectedAutocompleteItem();
          }
          break;
      }
    },
    [
      inputValue,
      handleSelectIndex,
      handleAddSelectedEmail,
      handleRemoveLastSelectedAutocompleteItem,
    ]
  );

  return (
    <div className="email-input">
      <div className="email-input-wrapper">
        <div className="autocomplete-selected-items-wrapper">
          {selectedEmails.map((em, index) => (
            <div
              key={`selected-email-${em}`}
              className={classNames('autocomplete-selected-item', {
                error: !EMAIL_REGEXP.test(em),
              })}
            >
              <span>{em}</span>
              <img
                className="error-icon"
                src={errorCircleIcon}
                alt="wrong email"
              />
              <img
                role="button"
                className="remove-item-icon"
                onClick={handleRemoveSelectedAutocompleteItemByIndex(index)}
                src={closeIcon}
                alt="remove selected email"
              />
            </div>
          ))}
        </div>
        <input
          className="autocomplete-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Enter recipients..."
        />
        <div
          ref={hiddenTextCalculationBlock}
          className="hiddent-text-width-calculation"
        >
          {inputValue}
        </div>
      </div>

      {autocompleteItems.length > 0 ? (
        <div
          className="autocomplete-wrapper"
          style={{ left: `${autocompleteLeft}px` }}
        >
          <div
            ref={autocompleteList}
            className="autocomplete-container"
            style={{ height: AUTOCOMPLETE_LIST_HEIGHT }}
          >
            <ul className="autocomplete-list">
              {autocompleteItems.map((item, idx) => (
                <li
                  className={classNames('autocomplete-item', {
                    focused: idx === focusedItemIndex,
                    disabled: selectedEmails.includes(item),
                  })}
                  key={item}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="autocomplete-bottom-blur" />
        </div>
      ) : null}
    </div>
  );
};
