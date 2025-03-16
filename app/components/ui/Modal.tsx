"use client";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ show, onClose, title, children }: ModalProps) {
  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
        </Transition.Child>
        <div className="fixed inset-0 z-10 flex items-center justify-center p-4 text-center sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel
              className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-[95%] sm:h-[95%] sm:p-6"
            >
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Header with improved title layout */}
              <div className="w-full bg-[#1e2937] text-white py-4 absolute top-0 left-0 right-0">
                <div className="pl-24 flex items-center">
                  <DocumentTextIcon className="h-6 w-6 mr-3" />
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-white"
                  >
                    {title}
                  </Dialog.Title>
                </div>
              </div>
              
              {/* Content with padding to accommodate header */}
              <div className="h-full overflow-y-auto pt-16"> 
                <div className="mt-4">{children}</div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
