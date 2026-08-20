# developed using the specialcpuidprogram.c provided during testing phase of the bypass as reference

import ctypes
import mmap
import os
import platform
import signal
import struct
import sys
import traceback


SYS_ARCH_PRCTL = 158
ARCH_SET_CPUID = 0x1012
SA_SIGINFO = 4
CPUID_LEAF = 0x336933
CPUID_RESPONSE = 0x1337

# Linux x86-64 general-register indexes in ucontext_t.uc_mcontext.gregs.
REG_RBX = 11
REG_RDX = 12
REG_RAX = 13
REG_RCX = 14
REG_RIP = 16
UCONTEXT_GREGS_OFFSET = 40


class SigSet(ctypes.Structure):
    _fields_ = [("values", ctypes.c_ulong * 16)]


SignalHandler = ctypes.CFUNCTYPE(
    None,
    ctypes.c_int,
    ctypes.c_void_p,
    ctypes.c_void_p,
)


class SigAction(ctypes.Structure):
    _fields_ = [
        ("handler", SignalHandler),
        ("mask", SigSet),
        ("flags", ctypes.c_int),
        ("restorer", ctypes.c_void_p),
    ]


def write_output(message: str) -> None:
    os.write(1, message.encode("utf-8", errors="replace"))


def format_registers(registers: ctypes.Array) -> str:
    return (
        f"EAX=0x{registers[0]:08x}, EBX=0x{registers[1]:08x}, "
        f"ECX=0x{registers[2]:08x}, EDX=0x{registers[3]:08x}"
    )


def main() -> None:
    if platform.machine().lower() not in {"x86_64", "amd64"}:
        os._exit(4)

    libc = ctypes.CDLL(None, use_errno=True)
    libc.syscall.restype = ctypes.c_long

    # A general CPUID wrapper using the System V x86-64 calling convention:
    # cpuid(leaf: EDI, subleaf: ESI, result: RDX). RBX is preserved.
    machine_code = bytes.fromhex(
        "53"          # push rbx
        "4989d0"      # mov r8, rdx
        "89f8"        # mov eax, edi
        "89f1"        # mov ecx, esi
        "0fa2"        # cpuid
        "418900"      # mov [r8], eax
        "41895804"    # mov [r8+4], ebx
        "41894808"    # mov [r8+8], ecx
        "4189500c"    # mov [r8+12], edx
        "5b"          # pop rbx
        "c3"          # ret
    )
    memory = mmap.mmap(
        -1,
        len(machine_code),
        prot=mmap.PROT_READ | mmap.PROT_WRITE,
    )
    memory.write(machine_code)
    address = ctypes.addressof(ctypes.c_char.from_buffer(memory))
    page_start = address & ~(mmap.PAGESIZE - 1)
    libc.mprotect.argtypes = [
        ctypes.c_void_p,
        ctypes.c_size_t,
        ctypes.c_int,
    ]
    libc.mprotect.restype = ctypes.c_int
    if libc.mprotect(
        ctypes.c_void_p(page_start),
        ctypes.c_size_t(mmap.PAGESIZE),
        mmap.PROT_READ | mmap.PROT_EXEC,
    ) != 0:
        error = ctypes.get_errno()
        raise OSError(error, os.strerror(error))

    cpuid_function = ctypes.CFUNCTYPE(
        None,
        ctypes.c_uint32,
        ctypes.c_uint32,
        ctypes.POINTER(ctypes.c_uint32),
    )(address)

    def cpuid(leaf: int, subleaf: int = 0) -> ctypes.Array:
        registers = (ctypes.c_uint32 * 4)()
        cpuid_function(leaf, subleaf, registers)
        return registers

    maximum_extended_leaf = cpuid(0x80000000)[0]
    if maximum_extended_leaf >= 0x80000004:
        brand_bytes = b"".join(
            struct.pack("<4I", *cpuid(leaf))
            for leaf in range(0x80000002, 0x80000005)
        )
        brand = brand_bytes.split(b"\0", 1)[0].decode(
            "ascii", errors="replace"
        ).strip()
    else:
        brand = "Unavailable"

    native_diagnostic = cpuid(CPUID_LEAF)
    write_output(f"Vendor string: {brand}\n")
    write_output(
        "Native leaf 0x336933: " + format_registers(native_diagnostic) + "\n"
    )

    @SignalHandler
    def handle_sigsegv(
        _signal_number: int,
        _signal_info: int,
        context: int,
    ) -> None:
        registers_address = context + UCONTEXT_GREGS_OFFSET
        registers = (ctypes.c_longlong * 23).from_address(registers_address)
        instruction = ctypes.string_at(registers[REG_RIP], 2)
        if registers[REG_RAX] != CPUID_LEAF or instruction != b"\x0f\xa2":
            os._exit(5)

        registers[REG_RAX] = CPUID_RESPONSE
        registers[REG_RBX] = 0
        registers[REG_RCX] = 0
        registers[REG_RDX] = 0
        registers[REG_RIP] += 2

    action = SigAction()
    action.handler = handle_sigsegv
    action.flags = SA_SIGINFO
    if libc.sigemptyset(ctypes.byref(action.mask)) != 0:
        os._exit(6)
    if libc.sigaction(signal.SIGSEGV, ctypes.byref(action), None) != 0:
        os._exit(6)
    write_output("SIGSEGV handler set up with sigaction.\n")

    result = libc.syscall(
        ctypes.c_long(SYS_ARCH_PRCTL),
        ctypes.c_long(ARCH_SET_CPUID),
        ctypes.c_ulong(0),
    )
    if result == -1:
        write_output("ARCH_SET_CPUID failed; CPUID faulting is unavailable.\n")
        os._exit(2)

    write_output("Running CPUID leaf 0x336933 (3,369,267)...\n")
    response = cpuid(CPUID_LEAF)

    # Restore the per-thread default before returning from the isolated probe.
    libc.syscall(
        ctypes.c_long(SYS_ARCH_PRCTL),
        ctypes.c_long(ARCH_SET_CPUID),
        ctypes.c_ulong(1),
    )
    write_output(
        "Spoofed CPUID leaf 0x336933: " + format_registers(response) + "\n"
    )
    if response[0] == CPUID_RESPONSE:
        write_output("Bypass works.\n")
    os._exit(0 if response[0] == CPUID_RESPONSE else 3)


if __name__ == "__main__":
    try:
        main()
    except BaseException:
        traceback.print_exc(file=sys.stderr)
        sys.exit(7)
